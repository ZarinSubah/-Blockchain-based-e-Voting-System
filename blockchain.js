const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
class Transaction {
    constructor(fromAddress, toAddress, amount = 1, vote = 1) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.vote = vote;

    }
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.vote)
            .toString();
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }


        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}


class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }




    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }



    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;

            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }

}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;

        // Place to store transactions in between block creation
        this.pendingTransactions = [];

        // How many coins a miner will get as a reward for his/her efforts
        this.miningReward = 0;
    }

    createGenesisBlock() {
        return new Block(0, "4/6/2019", "Genesis block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {

        // Create new block with all pending transactions and mine it..
        let block = new Block(Date.now(), this.pendingTransactions);
        let t = new Blockchain();
        block.previoushash = this.getLatestBlock().hash;

        console.log('Previous hash:' + block.previoushash);
        block.mineBlock(this.difficulty);


        // Add the newly mined block to the chain
        this.chain.push(block);


        // Reset the pending transactions and send the mining reward
        this.miningReward = 0;
        this.pendingTransactions = [

            new Transaction(null, miningRewardAddress, this.miningReward)
        ];

    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }


    //Balance of each voter

    getBalanceOfAddress(address) {
        let balance = 1; // you start at zero!

        // Loop over each block and each transaction inside the block
        for (const block of this.chain) {
            for (const trans of block.transactions) {

                // If the given address is the sender -> reduce the balance
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if (balance <= 0) {
                    balance = 0;
                }
                if (trans.amount > 1) {
                    balance = 1;
                }

            }
        }

        return balance;
    }


    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previoushash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}
module.exports.Blockchain = Blockchain;

module.exports.Block = Block;

module.exports.Transaction = Transaction;
