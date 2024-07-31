const StellarSdk = require('@stellar/stellar-sdk');
const horizonUrl = 'https://horizon-testnet.stellar.org';
const rpcUrl = 'https://soroban-testnet.stellar.org:443';

const TEST_ACCOUNT = 'GDAYOSOILNQ7C5ZGR6QYFOLEDFWW5L766PPMBDLZ6UMM22MCMVJP6TEJ';

class StellarServer {
    static server;
    static keypair;
    static account;
    static electionWasm;
    static ballotWasm;
    electionAddress = "";
    ballotAddresses = [];
    ready = false;
    
    constructor() {
        // this.server = new StellarSdk.Horizon.Server(horizonUrl);
        this.server = new StellarSdk.SorobanRpc.Server(rpcUrl);
        this.loadAccount();
        this.loadWasmFiles();
    }

    //should include versioning on these and load them based on some env
    //for now, result of `stellar keys crypto-vote` -> public key: GDAYOSOILNQ7C5ZGR6QYFOLEDFWW5L766PPMBDLZ6UMM22MCMVJP6TEJ
    //~/.config/soroban/identity/crypto-vote.toml -> default identity file location
    async loadWasmFiles() {
        this.electionWasm = await new File([], './deploy/crypto_vote_election.optimized.wasm').arrayBuffer();
        this.ballotWasm = await new File([], './deploy/crypto_vote_ballot.optimized.wasm').arrayBuffer();
    }

    async loadAccount() {
        try {
            // this.keypair = StellarSdk.Keypair.fromPublicKey(TEST_ACCOUNT);
            this.keypair = StellarSdk.Keypair.random();
            this.account = await this.server.getAccount(TEST_ACCOUNT);
            this.ready = true;
        } catch (error) {
            console.error("ERROR: Failed to initialize account state!", error);
        }
    }

    isReady() {
        return this.ready;
    }

    getElectionId() {
        return this.electionAddress;
    }

    //returns bool verifying election has started
    //sets electionAddress for this StellarServer instance
    async startElection(electionName, durationInMillis, candidates) {
        if (!this.ready) {
            console.warn("Warning: StellarServer not ready yet.");
            return;
        }
        try {
            const fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const electionTxn = this.getTxnBuilder(fee, tb);
            this.electionAddress = await this.uploadWasm(electionTxn, this.electionWasm);
            console.log(this.electionAddress);

            let endTime = new Date();
            endTime.setMilliseconds(endTime.getMilliseconds() + durationInMillis);

            let startTxn = this.getTxnBuilder(fee, tb);
            startTxn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: this.electionAddress,
                    function: "start_election",
                    args: StellarSdk.nativeToScVal(endTime.getMilliseconds(), {type: 'number'})
                })
            ).build();
            txn.sign(this.keypair);
            await server.submitAsyncTransaction(startElection);
        } catch (error) {
            console.error("Error! Could not start election.", error);
        }
    }

    //returns bool
    async electionInProgress(electionAddress) {
        if (!this.ready) {
            console.warn("Warning: StellarServer not ready yet.");
        }
        try {
            const fee = await this.server.fetchBaseFee();
            const txn = this.getTxnBuilder(fee);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: electionAddress,
                    function: "in_progress"
                })
            ).build();
            txn.sign(this.keypair);
            return await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Could not verify election in progress", error);
        }
    }

    //generates ballot ledger
    //returns ballotAddress
    async generateBallot(electionAddress) {
        if (!this.ready) {
            console.warn("Warning: Election not ready yet.");
        }
        try {
            let fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const txn = this.getTxnBuilder(fee, tb);
            let ballotAddress = await this.uploadWasm(txn, this.ballotWasm);

            // tb = await this.server.fetchTimebounds(100);
            const initTxn = this.getTxnBuilder(fee, tb);
            initTxn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: this.ballotAddress,
                    function: "initialize"
                })
            ).build();
            txn.sign(this.keypair);
            await server.submitAsyncTransaction(initTxn);
            return ballotAddress;
        } catch (error) {
            console.error("Error! Could not generate ballot", error);
        }
    }

    //adds ballot ledger to election ledger
    //returns length of ballotAddresses for simple verification
    async addBallotToElection(electionAddress, ballotAddress) {
        if (!this.ready) {
            console.warn("Warning!: Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const txn = this.getTxnBuilder(fee, tb);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: electionAddress,
                    function: "add_ballot",
                    args: {
                        "ballot_id": StellarSdk.nativeToScVal(ballotAddress, {type: 'Address'})
                    }
                })
            ).build();
            txn.sign(this.keypair);
            await server.submitAsyncTransaction(initTxn);
            //potentially inaccurate/naive state. for important operations fetch from election ledger directly
            this.ballotAddresses.push(ballotAddress);
            return this.ballotAddresses.length;
        } catch (error) {
            console.error("Error! Could not add ballot to election", error);
        }
    }

    //returns bool
    async hasVoted(ballotAddress) {
        if (!this.ready) {
            console.warn("Warning!: Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const txn = this.getTxnBuilder(fee, tb);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotAddress,
                    function: "has_voted"
                })
            ).build();
            txn.sign(this.keypair);
            return await server.submitAsyncTransaction(txn);
        } catch(error) {
            console.error("Error! Could not verify if ballot has voted", error);
        }
    }

    //votes must have string keys with int values
    //TODO: verify that votes gets passed correctly. may need to update keys from Symbol to String
    //returns bool
    async submitVote(ballotAddress, votes) {
        if (!this.ready) {
            console.warn("Warning! Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const txn = this.getTxnBuilder(fee, tb);
            
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotAddress,
                    function: "vote",
                    args: {
                        "votes": StellarSdk.nativeToScVal(votes)
                    }
                })
            ).build();
            txn.sign(this.keypair);
            await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Could not submit votes to ballot with id", ballotAddress, error);
        }
    }

    //returns votes object associated with provided ballotAddress
    async getVotes(ballotAddress) {
        if (!this.ready) {
            console.warn("Warning! Election not ready yet.");
            return;
        }
        try {
            let fee = await this.server.fetchBaseFee();
            let tb = await this.server.fetchTimebounds(100);
            const txn = this.getTxnBuilder(fee, tb);
            txn.addOperation(
                StellarSdk.Operation.invokeContractFunction({
                    contract: ballotAddress,
                    function: "get_votes",
                })
            ).build();
            txn.sign(this.keypair);
            return await server.submitAsyncTransaction(txn);
        } catch (error) {
            console.error("Error! Couldn't fetch votes for ballot with ID", ballotAddress, error);
        }
    }

    //utility function
    //returns a primed TransactionBuilder
    getTxnBuilder(fee, timebounds) {
        return new StellarSdk.TransactionBuilder(
            this.account, { fee: fee, networkPassphrase: StellarSdk.Networks.TESTNET, timebounds: timebounds }
        );
    }

    //utility function
    //returns contractId of uploaded .wasm
    async uploadWasm(txn, wasm) {
        txn.addOperation(StellarSdk.Operation.uploadContractWasm({wasm: wasm})).build();
        // txn.sign(this.keypair);
        // this.keypair.sign(txn);
        // let prepared = this.server.prepareTransaction(txn);
        // this.keypair.sign(prepared);
        return await this.server.submitTransaction(txn);
    }
}

module.exports = {
    StellarServer
}