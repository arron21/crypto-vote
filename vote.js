class Vote {
    constructor( item, previousVoter, currentVoter, voterName ) {
        this.item = item;
        this.previousVoter = previousVoter;
        this.currentVoter = currentVoter;
        this.voterName = voterName;
    }

    toString() {
        return JSON.stringify([ this.item, this.previousVoter, this.currentVoter, this.voterName ]);
    }
}

module.exports = {
    Vote
}