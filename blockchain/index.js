const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
var _ = require('lodash/core');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain{
    constructor(){
        this.chain = [Block.gensis()];
    }   

    addBlock({data}) {
         const newBlock = Block.mineBlock({
             data,
            lastBlock : this.chain[this.chain.length - 1]
        });
        this.chain.push(newBlock);
    }

    validTransactionData({ chain }) {

        for(let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address){
                    rewardTransactionCount += 1;

                    if(rewardTransactionCount > 1){
                        console.error('Miner rewards exceed limit');
                        return false;
                    }
                    
                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD){
                        console.error('Miner reward amount is invalid');
                        return false; 
                    } 
                } else {
                    if( !Transaction.validTransaction(transaction)){
                        console.error('Invalid transaction');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if( transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if(transactionSet.has(transaction)){
                        console.error('An identical transaction apperas more than once in the block')
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        
        return true;
    }

    static isValidChain(chain){
        if(!_.isEqual(chain[0] , Block.gensis())) return false;

        for( let i  = 1 ; i < chain.length - 1 ; i ++){
            const lastDifficulty = chain[i-1].difficulty;
            
            if(chain[i].lastHash !== chain[i-1].hash)
                return false;
            const {timestamp , data , lastHash , hash, nonce, difficulty} = chain[i];
            if(cryptoHash(data, lastHash, timestamp, nonce, difficulty) != hash)
                return false;    
            
            if(Math.abs(lastDifficulty - difficulty) > 1 ) return false;
        }
        return true;
    }

    replaceChain(chain, validateTransactions, onSuccess){
        if(chain.length >= this.chain.length){
            if(Blockchain.isValidChain(chain)) {
                if(validateTransactions && ! this.validTransactionData({ chain })) {
                    console.error('The incoming chain has invalid data');
                    return;
                }
                
                if(onSuccess) onSuccess();
                this.chain = chain;
            }else{
                console.error("not a valid chain");
            }
        }else{
            console.error("New chain is shorter");
        }
    }

}

module.exports = Blockchain;
