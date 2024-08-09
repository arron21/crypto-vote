const StellarSdk = require('@stellar/stellar-sdk');
const horizonUrl = 'https://horizon-testnet.stellar.org';

const server = new StellarSdk.Horizon.Server(horizonUrl);

class StellarServer {
    static server;
    static account;
    static electionWasm;
    static ballotWasm;
    electionContractId = "";
    ballotContractIds = [];
    ready = false;
    
    constructor() {
        this.server = new StellarSdk.Horizon.Server(horizonUrl);
        this.loadAccount();
    }

    //should include versioning on these and load them based on some env
    //for now, result of `stellar keys crypto-vote` -> public key: GDAYOSOILNQ7C5ZGR6QYFOLEDFWW5L766PPMBDLZ6UMM22MCMVJP6TEJ
    //~/.config/soroban/identity/crypto-vote.toml -> default identity file location
    loadWasmFiles() {
        this.electionWasm = new File([], './deploy/crypto_vote_election.optimized.wasm').arrayBuffer();
        this.ballotWasm = new File([], './deploy/crypto_vote_ballot.optimized.wasm').arrayBuffer();
    }

    async loadAccount() {
        try {
            this.account = await server.loadAccount('GDAYOSOILNQ7C5ZGR6QYFOLEDFWW5L766PPMBDLZ6UMM22MCMVJP6TEJ')
            this.ready = true;
        } catch (error) {
            console.error("ERROR: Failed to initialize account state!", error);
        }
    }

    isReady() {
        return this.ready;
    }

    getElectionId() {
        return this.electionContractId;
    }

    //returns bool verifying election has started
    //sets electionContractId for this StellarServer instance
    async startElection(electionName, durationInMillis, candidates) {
        if (!this.ready) {
            console.warn("Warning: StellarServer not ready yet.");
            return;
        }
        try {
            const fee = await this.server.fetchBaseFee();
            const electionTxn = this.getTxnBuilder(fee);
            this.electionContractId = await this.uploadWasm(electionTxn, this.electionWasm);
            console.log(this.electionContractId);

            let endTime = new Date();
            endTime.setMilliseconds(endTime.getMilliseconds() + durationInMillis);

            let startTxn = this.getTxnBuilder();
            startTxn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: this.electionContractId,
                    function: "start_election",
                    args: StellarSdk.nativeToScVal(endTime.getMilliseconds(), {type: 'number'})
                })
            ).build();

            await server.submitAsyncTransaction(startElection);
        } catch (error) {
            console.error("Error! Could not start election.", error);
        }
    }

    //returns bool
    async electionInProgress(electionId) {
        if (!this.ready) {
            console.warn("Warning: StellarServer not ready yet.");
        }
        try {
            const fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: electionId,
                    function: "in_progress"
                })
            ).build();

            return await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Could not verify election in progress", error);
        }
    }

    //generates ballot ledger
    //returns ballotId
    async generateBallot(electionId) {
        if (!this.ready) {
            console.warn("Warning: Election not ready yet.");
        }
        try {
            let fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            let ballotId = await this.uploadWasm(txn, this.ballotWasm);

            const initTxn = this.getTxnBuilder(fee);
            initTxn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: this.ballotId,
                    function: "initialize"
                })
            ).build();

            await server.submitAsyncTransaction(initTxn);
            return ballotId;
        } catch (error) {
            console.error("Error! Could not generate ballot", error);
        }
    }

    //adds ballot ledger to election ledger
    //returns length of ballotContractIds for simple verification
    async addBallotToElection(electionId, ballotId) {
        if (!this.ready) {
            console.warn("Warning!: Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: electionId,
                    function: "add_ballot",
                    args: {
                        "ballot_id": StellarSdk.nativeToScVal(ballotId, {type: 'Address'})
                    }
                })
            ).build();
            await server.submitAsyncTransaction(initTxn);
            //potentially inaccurate/naive state. for important operations fetch from election ledger directly
            this.ballotContractIds.push(ballotId);
            return this.ballotContractIds.length;
        } catch (error) {
            console.error("Error! Could not add ballot to election", error);
        }
    }

    //returns bool
    async hasVoted(ballotId) {
        if (!this.ready) {
            console.warn("Warning!: Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotId,
                    function: "has_voted"
                })
            ).build();
            return await server.submitAsyncTransaction(txn);
        } catch(error) {
            console.error("Error! Could not verify if ballot has voted", error);
        }
    }

    //votes must have string keys with int values
    //TODO: verify that votes gets passed correctly. may need to update keys from Symbol to String
    //returns bool
    async submitVote(ballotId, votes) {
        if (!this.ready) {
            console.warn("Warning! Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotId,
                    function: "vote",
                    args: {
                        "votes": StellarSdk.nativeToScVal(votes)
                    }
                })
            ).build();

            await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Could not submit votes to ballot with id", ballotId, error);
        }
    }

    //returns votes object associated with provided ballotId
    async getVotes(ballotId) {
        if (!this.ready) {
            console.warn("Warning! Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotId,
                    function: "get_votes",
                })
            ).build();

            return await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Couldn't fetch votes for ballot with ID", ballotId, error);
        }
    }

    //utility function
    //returns a primed TransactionBuilder
    getTxnBuilder(fee) {
        return new StellarSdk.TransactionBuilder(
            this.account, { fee, networkPassphrase: StellarSdk.Networks.TESTNET }
        );
    }

    //utility function
    //returns contractId of uploaded .wasm
    async uploadWasm(txn, wasm) {
        txn.addOperation(StellarSdk.Operation.uploadContractWasm({wasm: wasm})).build();
        return await this.server.submitAsyncTransaction(uploadTxn);
    }
}

module.exports = {
    StellarServer
}