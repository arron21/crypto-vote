const { mockElection, generateMockVote, countVotes, getVoteByName } = require('./mockElection.js');
const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'))
app.set('views', './public')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index.ejs')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


app.get('/mock-election', (req, res) => {
  let count = req.query.count
  if (typeof(count) !== Number) {
    count = 10; //some default
  }
  let results = mockElection(count)
  results.totalVotes = count;
  res.render('index.ejs', { electionResults: results })
})

app.get('/create-voter', (req, res) => {
  const results = generateMockVote()
  res.render('index.ejs', { voterId : results })
})

app.get('/count-votes', (req, res) => {
  const results = countVotes()
  res.render('index.ejs', { electionCount: results })
})

app.get('/get-vote-by-id', (req, res) => {
  console.log("🚀 ~ app.get ~ req:", req.query)
  const voterId = req.query.id
  try {
    const result = getVoteByName(voterId)
    res.render('index.ejs', { voterInfo: result })
  } catch (error) {
    console.log("🚀 ~ app.get ~ error:", error)
    res.render('index.ejs', 
      { voter : 
        { error: 'The Voter ID does not exist, Are there any votes? Does your GET request have the correct ID? ex: http://localhost:3000/get-vote-by-id?id=23c16138-a31d-482c-a521-c388ad684780' }
    })
  }
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