const { generateKeyPairSync, createSign, createVerify, createHash, randomInt, randomUUID } = require('node:crypto');

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

module.exports = {
    Block
}