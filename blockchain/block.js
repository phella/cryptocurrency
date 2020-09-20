const { GENSIS_DATA, MINE_RATE } = require('../config');
const {cryptoHash} = require('../util');
const hexToBinary = require('hex-to-binary');

class Block{
    constructor({timestamp, lastHash, hash, data, nonce, difficulty}){
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static gensis(){
        return new Block(GENSIS_DATA);
    }

    static mineBlock({data, lastBlock}){
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let {difficulty} = lastBlock;
        let nonce = 0;

        do{
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({originalBlock: lastBlock, timestamp})
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        }
        while(hexToBinary( hash ).substring(0,difficulty) !== '0'.repeat(difficulty));

        return new this({data,
            lastHash,
            timestamp,
            difficulty,
            nonce,
            hash
        }); 

    }

    static adjustDifficulty({originalBlock, timestamp}){
        let {difficulty} = originalBlock;
        if(difficulty < 1)
            return 1;
        const difference = timestamp - originalBlock.timestamp;
        if(difference > MINE_RATE){
            return difficulty - 1;
        }

        return difficulty + 1;
    }
}

module.exports = Block;