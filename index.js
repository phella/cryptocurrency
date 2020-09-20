const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain/index');
const PubSub = require('./app/pubsub');
const { response } = require('express');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new transactionMiner({ blockchain, transactionPool, wallet, pubsub});

const DEFAULT_PORT = 3000;
const ROOT_NODE_aDDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req,res) => {
    const { data } = req.body;
    
    blockchain.addBlock({ data });
    
    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});

app.post('/api/transact',(req, res) => {
    const { amount, recipient} = req.body;

    let transaction = transactionPool
    .existingTransaction({ inpuutAddress: wallet.publicKey});
    
    try {
        if(transaction) {
            transaction.update({ senderWallet: wallet, recipient: amount});
        } else {
            transaction = wallet.createTransaction({recipient,
                amount,
                chain: blockchain.chain
            });
        }
    } catch(err) {
        return res.status(400).json({type: 'error', message: err.message});
    }
    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction(transaction);

    res.json({ type: 'sucess', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', () => {
    transactionMiner.mineTransactions();

    res.redirect('/api/blocks');
});

app.get('/api/wallet-info', () => {
    const address = wallet.publicKey;

    res.json({ 
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain })
    });
});

const syncChainsAndTransactions = () => {
    request({ url: `${ROOT_NODE_aDDRESS}/api/blocks`}, (err, res, body) => {
        if(!err && res.statusCode === 200) {
            const rootChain = JSON.parse(body);
            
            console.log('replace a chain on sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NODE_aDDRESS}/api/transaction-pool-map`}, (err, res, body) => {
        if(!err && res.statusCode === 200) {
            const transactions = JSON.parse(body);
            
            console.log('replace transactions pool on sync with', transactions);
            transactionPool.transactionMap = transactions;
        }
    });
};


let PEER_PORT ;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000 );
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`listening at localhost: ${PORT}`);

    if( PORT !== DEFAULT_PORT) {
        syncChainsAndTransactions();
    }
});
