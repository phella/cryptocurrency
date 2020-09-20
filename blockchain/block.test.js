const Block = require('./block');
const { GENSIS_DATA, MINE_RATE } = require('../config');
const cryptoHash = require('../util/crypto');
const hexToBinary = require('hex-to-binary');

describe('Block' , ()=> {
    const timestamp = 2000;
    const lastHash = 'foo-hash';
    const hash = 'bar-hash';
    const data = ['blockchain' , 'data'];
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({
        timestamp,
        lastHash,
        hash,
        data,
        nonce,
        difficulty
    });
    
    it('created successfully' , ()=> {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.hash).toEqual(hash);
        expect(block.data).toEqual(data);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });

    describe('gensis' , ()=> {
        const gensisBlock = Block.gensis();

        it('returns a Block instance', ()=> {
            expect(gensisBlock instanceof Block).toBe(true);
        });

        it('returns the gensis data', ()=>{
            expect(gensisBlock).toEqual(GENSIS_DATA);
        })
    });

    describe('Mining' , ()=>{
        const lastBlock = Block.gensis();
        const data = "mined data";
        const mineBlock = Block.mineBlock({lastBlock, data});

        it('returns a block instance', ()=>{
            expect(mineBlock instanceof Block).toBe(true);
        });

        it('sets the lastHash correctly', ()=>{
            expect(mineBlock.lastHash).toEqual(lastBlock.hash);
        });

        it('creates a SHA-256 hash based on the poprer inputs', ()=> {
            expect(mineBlock.hash)
            .toEqual(cryptoHash(mineBlock.timestamp,
                mineBlock.data,
                mineBlock.lastHash, 
                mineBlock.nonce,
                mineBlock.difficulty));
        });

        it('sets a hash with valid difficulty', ()=> {
            expect(hexToBinary(mineBlock.hash).substring(0,mineBlock.difficulty))
            .toEqual('0'.repeat(mineBlock.difficulty));
        });

        it('adjusts the difficulty', ()=>{
            const possibleResults = [lastBlock.difficulty - 1 , lastBlock.difficulty + 1];
            expect(possibleResults.includes(mineBlock.difficulty)).toBe(true);
        });
    });
    describe('adjustDifficulty', ()=> {

        it('raises the difficulty for a quickly mined block', ()=>{
            expect(Block.adjustDifficulty({ 
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE - 100
                })).toEqual(block.difficulty + 1);
        });

        it('lowers the difficulty for a quickly mined block', ()=>{
            expect(Block.adjustDifficulty({ 
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE + 100
                })).toEqual(block.difficulty - 1);
        });

        it('has lower limit of 1', () => {
            block.difficulty = -1;

            expect(Block.adjustDifficulty({originalBlock: block})).toEqual(1);
        });
    });
});