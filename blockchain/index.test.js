const Blockchain = require('.');
const Block = require('./block');
const crypto = require('../util/crypto');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

describe('Blockchain', ()=> {
    let blockchain, errorMock ;

    beforeEach( () => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        errorMock = jest.fn();
        global.console.error = errorMock;
    });

    it('contains a chain array instance', ()=> {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with the gensis block', ()=>{
        expect(blockchain.chain[0]).toEqual(Block.gensis());
    });

    it('adds a new block to the chain', ()=> {
        const newData = 'foo bar';
        blockchain.addBlock({data: newData});

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });

    describe('isValidChain' , ()=> {
        describe('Check gensis block' , ()=>{
            it('return false' , ()=> {
                blockchain.chain[0] = {data : 'fake-gensis'};

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
            
            describe('Gensis Block check' , ()=> {

                beforeEach(()=>{
                    blockchain.addBlock({data : 'bears'});
                    blockchain.addBlock({data : 'girraf'});
                    blockchain.addBlock({data : 'elephant'});
                });
                describe('last hash reference has changed', ()=>{
                    it('returns false', ()=>{
                        blockchain.chain[2].lastHash = 'broken-lastHash';

                        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                    });

                    describe('contains invalid field' , ()=>{
                        it('returns false', ()=> {

                            blockchain.chain[2].data = 'some bad and evil data';
                            expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                        });
                    });

                    describe('chain contains hacked difficulty' , ()=> {
                        it('returns false', ()=>{
                            const lastBlock = blockchain.chain[blockchain.chain.length-1];
                            const lastHash = lastBlock.hash;
                            const timestamp = Date.now();
                            const nonce = 0;
                            const data = [];
                            const difficulty = lastBlock.difficulty - 3;
                            const hash = crypto(timestamp, lastHash, difficulty, nonce, data);

                            const badBlock = new Block({timestamp, lastHash, hash, nonce, data});

                            blockchain.chain.push(badBlock);
                            expect(Blockchain.isValidChain(blockchain))
                            .toBe(false);
                        });
                    });

                    describe('Chain is completely valid', ()=>{
                        it('returns true', ()=>{

                            expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                        });

                    });

                });
            });
        });
    });

    describe('replaceChain()', ()=>{

        describe('new chain is smaller than chain',()=>{
            
            beforeEach(()=> {
                let logMock = jest.fn();

                global.console.log = logMock;
            });
            
            
            it('chain not replaced', ()=>{
                newChain.chain[0] = {new : 'chain'};
                const originalChain = blockchain.chain;
                blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(originalChain);
            });
            /*
            it('logs an error', ()=> {
                expect(errorMock).toHaveBeenCalled();
            });
            */
        });

        describe('Chain is longer', ()=>{
            beforeEach(()=>{
                newChain.addBlock({data : 'bears'});
                newChain.addBlock({data : 'girraf'});
                newChain.addBlock({data : 'elephant'});
            });
        
        describe('and the validateTransactions flag is true', () => {
            it('calls validTransactionData()', () => {
                const validTransactionDataMock = jest.fn();

                blockchain.validTransactionData = validTransactionDataMock;

                newChain.addBlock({ data: 'foo'});
                blockchain.replaceChain(newChain.chain, true);

                expect(validTransactionDataMock).toHaveBeenCalled();
            })
        });
           
            describe('and chain is invalid', ()=>{
                it("deosn't replace the chain",()=>{
                    newChain.chain[2].hash = 'some-fake-hash';
                    const originalChain = blockchain.chain;
                    blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).toEqual(originalChain);
            
                });
            });

            describe('and chain is valid', ()=>{
                it('replaces the chain' , ()=>{
                    
                    blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).toEqual(newChain.chain);
            
                });
            });
        });

    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;

        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({ recipient: 'foo', amount: 65});
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet});
        });

        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction]});

                expect(blockchain.validTransactionData({ chain: newChain.chain})).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });

        describe('and the transaction data has multiple rewards', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction]});

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and the transaction data has at least one malformed outputMap', () => {
            describe('and the transaction is not a reward transaction', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[wallet.publicKey] = 9999999;

                    newChain.addBlock({ data: [transaction, rewardTransaction]});

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the transaction us a reward transaction', () => {
                it('returns false and logs an error', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 9999999;

                    newChain.addBlock({ data: [transaction, rewardTransaction] });
                    
                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at leaast one malformed input', () => {
            it('returns false and logs an error',() => {
                wallet.balance = 9000;

                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    fooRecipient:100
                };

                const evilTransaction = {
                    input: {
                        timeStamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)
                    },
                    outputMap: evilOutputMap
                }; 

                newChain.addBlock({ data: [evilTransaction, rewardTransaction] });
                expect(blockchain.validTransactionData({ chain: newChain.chain})).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and a block contains multiple identical transactions', () => {
            it('returns false and logs an error',() => {
                newChain.addBlock({
                    data: [transaction, transaction, transaction]
                });

                expect(blockchain.validTransactionData({ chain: newChain.chain})).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });
    });
})