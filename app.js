const { generateKeyPairSync, createSign, createVerify, createHash, randomInt } = require('node:crypto');

class Transaction {
    constructor( item, payer, payee ) {
        this.item = item;
        this.payer = payer;
        this.payee = payee;
    }

    toString() {
        const json = [ this.item, this.payer, this.payee ];
        return JSON.stringify(json);
    }
}

class Block {

    nonce = randomInt(99999999);

    constructor(prevHash, item, ts = Date.now()){
        this.prevHash = prevHash;
        this.item = item;
        this.ts = ts;
    }

    get hash() {
        const str = JSON.stringify(this);
        const hash = createHash('sha256')
        .update(str)
        .digest('hex');

        return hash;
    }
}

class Chain {
    static instance = new Chain();
    chain;

    constructor() {
        this.chain = [new Block('', new Transaction(42, 'genesis', 'arron'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1]
    }

    mine(nonce) {
        let solution = 1;
        console.log('⛏️  mining...')
    
        while(true) {
    
          const hash = createHash('md5');
          hash.update((nonce + solution).toString()).end();
    
          const attempt = hash.digest('hex');
    
          if(attempt.slice(0,4) === '0000'){
            console.log(`Solved: ${solution}`);
            return solution;
          }
    
          solution += 1;
        }
      }

    addBlock(item, publicKey, signature) {
        const verify = createVerify('sha256');
        verify.update(item.toString());
    
        const isValid = verify.verify(publicKey, signature);
    
        if (isValid) {
          const newBlock = new Block(this.lastBlock.hash, item);
          this.mine(newBlock.nonce);
          console.log(newBlock)
          console.log('test:'+ item)
          this.chain.push(newBlock);
        }

    }
}

class Wallet {
    publicKey;
    privateKey;

    constructor() {
        const {
            publicKey,
            privateKey,
          } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
          });
          this.privateKey = privateKey;
          this.publicKey = publicKey;
    }


    sendItem(item, payeePublicKey) {
        const transaction = new Transaction(item, this.publicKey, payeePublicKey);
        const sign = createSign('sha256');
        console.log('etst2:' +transaction.toString())

        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);

        console.log(signature)
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();


    satoshi.sendItem(50, bob.publicKey);
    bob.sendItem(23, alice.publicKey);
    alice.sendItem(5, bob.publicKey);

console.log(Chain.instance)