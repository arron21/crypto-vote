const { generateKeyPairSync, createSign } = require('node:crypto');
const { Vote } = require('./vote.js');

const { Chain } = require('./chain.js');

class Ballot {
    publicKey;
    privateKey;

    constructor(voterName) {
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
          this.voterName = voterName;
    }

    sendItem(item, voterPublicKey) {
        const vote = new Vote(item, this.publicKey, voterPublicKey, this.voterName);
        const sign = createSign('sha256');
        sign.update(vote.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(vote, this.publicKey, signature);
    }

    getVoterBallot() {
        return this
    }
}

module.exports = {
    Ballot
}