const {
    Keypair,
    Contract,
    Operation,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
} = require('@stellar/stellar-sdk');
// const horizonUrl = 'https://horizon-testnet.stellar.org';
const rpcUrl = 'https://soroban-testnet.stellar.org:443';

const PUBLIC_KEY = 'GDAYOSOILNQ7C5ZGR6QYFOLEDFWW5L766PPMBDLZ6UMM22MCMVJP6TEJ';
const PRIVATE_KEY = 'SBWD2UW73ZQ7XU5GXTG7LIZXYUOQ6KDK52RHVPITTFKIT2SHL3R74MOZ';

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
        this.server = new SorobanRpc.Server(rpcUrl);
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
            this.keypair = Keypair.fromSecret(PRIVATE_KEY);
            this.account = await this.server.getAccount(PUBLIC_KEY);
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

        //utility function
    //returns a primed TransactionBuilder
    getTxnBuilder() {
        return new TransactionBuilder(
            this.account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }
        ).setTimeout(100);
    }

    //utility function
    //returns contractId of uploaded .wasm
    async uploadWasm(txn, wasm) {
        let built = txn.addOperation(Operation.uploadContractWasm({wasm: wasm})).build();
        let prepared = await this.server.prepareTransaction(built);
        prepared.sign(this.keypair);
        return await this.server.sendTransaction(prepared);
    }

    //RPC run based on https://developers.stellar.org/docs/learn/encyclopedia/contract-development/contract-interactions/stellar-transaction
    //sets electionAddress for this StellarServer instance
    async startElection(electionName, durationInMillis, candidates) {
        if (!this.ready) {
            console.warn("Warning: StellarServer not ready yet.");
            return;
        }
        try {
            const electionTxn = this.getTxnBuilder();
            let sendRes = await this.uploadWasm(electionTxn, this.electionWasm);
            if (sendRes.status === "PENDING") {
                let getRes = await this.server.getTransaction(sendRes.hash);
                while (getRes.status === "NOT_FOUND") {
                    console.log("Waiting for txn confirmation");
                    getRes = await this.server.getTransaction(sendRes.hash);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
                console.log('txn complete', JSON.stringify(getRes));

                if (getRes.status === "SUCCESS") {
                    if (!getRes.resultMetaXdr) {
                        throw "Empty resultMetaXDR in getTxn response";
                    }
                    let txnMeta = getRes.resultMetaXdr;
                    let txnVal = getRes.returnValue;
                    console.log('Txn result:', txnVal.value());
                } else {
                    throw `Txn failed: ${getRes.resultXdr}`;
                }
            } else {
                throw sendRes.errorResultXdr;
            }
        } catch (error) {
            console.error("Error! Could not start election.", error);
        }
    }
}

module.exports = {
    StellarServer
}