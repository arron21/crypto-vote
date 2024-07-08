const { randomUUID } = require('node:crypto');
const { Ballot } = require('./ballot.js');
const { Chain } = require('./chain.js');
const { count } = require('node:console');


// Initialize the ballot for everyone to send votes to
const GLOBAL_BALLOT = new Ballot();
const GLOBAL_CHAIN = new Chain();

function generateMockVoter(voteObj) {
  // create a Ballot for voter & send vote to ballot
  // we need to create a way for a voter to access their ballot after it's been created
  // maybe a UUID that is returned to the voter... ideally something like a SSN would be "best"
  const randomVoterId = randomUUID()
  console.log("🚀 ~ generateMockVoter ~ randomVoterId:", randomVoterId)
  new Ballot(randomVoterId).sendItem(voteObj, GLOBAL_BALLOT.publicKey);
  // console.log('voter ballot '+ voter_ballot)
  return 'this is your unique voter ID, save it so you can view your vote later: ' + randomVoterId
}

function generateMockVote() {
  const candidates = ['alpha', 'beta', 'gamma'];
    const values = [1, 2, 3];
    const obj = {};
    candidates.forEach(prop => {
      const randomIndex = Math.floor(Math.random() * values.length);
      obj[prop] = values.splice(randomIndex, 1)[0];
    });
    return generateMockVoter(obj);
}

function generateMockVotes(count) {
    console.log('Generating mock votes');
    for (let i = 0; i < count; i++) {
      generateMockVote()
    }
  }

function getVoteByName(name) {
    const block = Chain.instance.chain.find(block => block.item.voterName === name);
    return block.item.item;
}

function mockElection(voterCount) { 
    generateMockVotes(voterCount);
    return GLOBAL_CHAIN.countVotes();
}

function countVotes() { 
  return GLOBAL_CHAIN.countVotes();
}



module.exports = {
    generateMockVotes,
    generateMockVote,
    getVoteByName,
    mockElection,
    countVotes
}