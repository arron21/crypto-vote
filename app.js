const { generateKeyPairSync, createSign, createVerify, createHash, randomInt } = require('node:crypto');

class Vote {
    constructor( item, previousVoter, currentVoter ) {
        this.item = item;
        this.previousVoter = previousVoter;
        this.currentVoter = currentVoter;
    }

    toString() {
        return JSON.stringify([ this.item, this.previousVoter, this.currentVoter ]);
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
        // https://www.rcvresources.org/history-of-rcv
        this.chain = [new Block('', new Vote({alpha: 0, beta: 0, gamma: 0}, 'initial block', 'Denmark1850'))];
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
          this.chain.push(newBlock);
        }

    }
}

class Ballot {
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


    sendItem(item, voterPublicKey) {
        const vote = new Vote(item, this.publicKey, voterPublicKey);
        const sign = createSign('sha256');
        sign.update(vote.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(vote, this.publicKey, signature);
    }
}


function countVotes() {
    const votes = Chain.instance.chain.map(block => block.item);
    const justVotes = votes.map(vote => vote.item);
    return justVotes.reduce((totals, obj) => {
        const newTotals = { ...totals };
    
        for (const key in obj) {
          if (newTotals.hasOwnProperty(key)) {
            newTotals[key] += obj[key];
          } else {
            newTotals[key] = obj[key];
          }
        }
    
        return newTotals;
      }, {});

}

// Initialize the ballot for everyone to send votes to
const GLOBAL_BALLOT = new Ballot();

// Send votes to the ballot
const satoshi = new Ballot();
satoshi.sendItem({alpha: 3, beta: 2, gamma: 1}, GLOBAL_BALLOT.publicKey);

const bob = new Ballot();
bob.sendItem({alpha: 2, beta: 1, gamma: 3}, GLOBAL_BALLOT.publicKey);

const alice = new Ballot();
alice.sendItem({alpha: 2, beta: 3, gamma: 1}, GLOBAL_BALLOT.publicKey);



const results = countVotes()
console.log(results)
