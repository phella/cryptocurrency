const cryptoHash = require('./crypto.js');

describe('cryptoHash', ()=> {
    
    it('generates a SHA-256 hashed output', ()=>{
        expect(cryptoHash('foo'))
        .toEqual("b2213295d564916f89a6a42455567c87c3f480fcd7a1c15e220f17d7169a790b"); 
    })

    it('Order independant' ,()=>{
        expect(cryptoHash('one' , 'two' , 'three'))
        .toEqual(cryptoHash('three' , 'two' , 'one'))
    })

    it('produces unique hash when proprties of object is changed', () =>{
        const foo = {};
        const hash = cryptoHash(foo);
        foo.a = 'a';

        expect(hash).not.toEqual(cryptoHash(foo));
    });
});