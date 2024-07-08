const { mockElection, generateMockVote, countVotes } = require('./mockElection.js');
const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.
  res.sendFile('/public/index.html');
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


app.get('/mock-election', (req, res) => {
  const results = mockElection(10)
  res.send(results)
})

app.get('/create-voter', (req, res) => {
  const results = generateMockVote()
  res.send(results)
})

app.get('/count-votes', (req, res) => {
  const results = countVotes()
  res.send(results)
})
/**
 * Entry point for the app
 * 
 * from here we can create the GLOBAL_BALLOT and GLOBAL_CHAIN
 * 
 * from here we can send votes to the GLOBAL_BALLOT which will be added to the GLOBAL_CHAIN
 * 
 * TODO: Make this an express API to call functions like running an election, casting a vote, etc.
 */

// Send votes to the ballot
// const satoshi = new Ballot('satoshi');
// satoshi.sendItem({alpha: 3, beta: 2, gamma: 1}, GLOBAL_BALLOT.publicKey);

// const bob = new Ballot('bob');
// bob.sendItem({alpha: 2, beta: 1, gamma: 3}, GLOBAL_BALLOT.publicKey);

// const alice = new Ballot('alice');
// alice.sendItem({alpha: 2, beta: 3, gamma: 1}, GLOBAL_BALLOT.publicKey);

// mockElection(10)