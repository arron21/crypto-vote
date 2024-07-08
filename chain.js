const { createVerify, createHash} = require('node:crypto');
const { Block } = require('./block.js');
const { Vote } = require('./vote.js');


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
        //   this.mine(newBlock.nonce);
        // console.log('Casting vote, no mining');
          this.chain.push(newBlock);
        }

    }

    countVotes() {
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
}

module.exports = {
    Chain
}