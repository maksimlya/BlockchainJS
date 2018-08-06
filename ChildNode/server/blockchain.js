const Transaction = require('./transaction');
const Block = require('./block');
const merkle = require('merkle');
const MerkleObject = require('./merkleObject');
const  SHA256 = require('crypto-js/sha256');


let elliptic = require('elliptic');
let ec = new elliptic.ec('secp256k1');


class Blockchain{
	constructor(){
		this.chain = [];
	}
	minePendingTransactions(miningRewardAddress,keyPair){
		let transactionHashes = [];
		let actualTransactions = [];
		let pendingTransactionsLength = this.pendingTransactions.length;
		for(var i = 0 ; i < 4 && i < pendingTransactionsLength ; i ++){
			actualTransactions.push(this.pendingTransactions.shift());
			transactionHashes.push(actualTransactions[i].calculateHash());
		}
		while(transactionHashes.length < 4)
			transactionHashes.push(Date.now() + '0');
		var tree = merkle('sha256',false).sync(transactionHashes);
		for(var i = 0 ; i < 4 && i < pendingTransactionsLength ; i ++){
			this.completedTransactions.push({hash: transactionHashes[i], merkleRoot: tree.root(), transaction: actualTransactions[i]});
		}
		let block = new Block(Date.now() ,tree.root(),this.getLatestBlock().blockHeader.hash);
		let signature = ec.sign(block.blockHeader.hash, keyPair.getPrivate(), "hex", {canonical: true});
		block.signature = signature;
		block.merkleTree = tree;
		block.transactions = actualTransactions;
		block.mineBlock(this.difficulty);

		console.log('Block successfully mined!');
		this.chain.push(block);

		this.pendingTransactions.push(new Transaction('Blockchain',miningRewardAddress,this.miningReward));
		return block;
	}

	createGenesisBlock(){
		return new Block("01/01/2018", [], "0");
	}

	getLatestBlock(){
		return this.chain[this.chain.length - 1];
	}

	

	addTransaction(transaction){
		this.pendingTransactions.push(transaction);
	}

	getProofElements(transaction){
		let controlHashes = [];
		let merkleRoot = transaction.merkleRoot;
		
		for(const block of this.chain){
			if(block.blockHeader.merkleRoot === merkleRoot){
				var allHashes = block.merkleTree.getProofPath(0);
				switch(transaction.hash){
					case allHashes[0].left:
					controlHashes.push({hash: allHashes[0].right,position: 'right'});
					controlHashes.push({hash: allHashes[1].right,position: 'right'});
					break;
					case allHashes[0].right:
					controlHashes.push({hash: allHashes[0].left,position: 'left'});
					controlHashes.push({hash: allHashes[1].right,position: 'right'});
					break;
				}
				allHashes = block.merkleTree.getProofPath(2);
				switch(transaction.hash){
					case allHashes[0].left:
					controlHashes.push({hash: allHashes[0].right,position: 'right'});
					controlHashes.push({hash: allHashes[1].right,position: 'left'});
					break;
					case allHashes[0].right:
					controlHashes.push({hash: allHashes[0].left,position: 'left'});
					controlHashes.push({hash: allHashes[1].right,position: 'left'});
					break;
				}
				
			}
		}
		
		return controlHashes;
	}

	validateTransaction(transaction,controlHashes){
		let hashedElement = '';
		if(controlHashes[0].position === 'left')
			hashedElement = SHA256(controlHashes[0].hash + transaction.hash).toString();
		else
			hashedElement = SHA256(transaction.hash + controlHashes[0].hash).toString();

		if(controlHashes[1].position === 'left')
			hashedElement = SHA256(controlHashes[1].hash + hashedElement).toString();
		else
			hashedElement = SHA256(hashedElement + controlHashes[1].hash).toString();

		if(hashedElement === transaction.merkleRoot)
			return true;
		else return false;

	}

	getBalanceOfAddress(address){
		let balance = 0;

		for(const transaction of this.completedTransactions){
				let controlHashes = this.getProofElements(transaction);
				if(!this.validateTransaction(transaction,controlHashes))
					continue;
				if(transaction.transaction.fromAddress === address){
					balance -= parseInt(transaction.transaction.amount);
				}
				if(transaction.transaction.toAddress === address){
					balance += parseInt(transaction.transaction.amount);
				}
			
		}
		return balance;
	}

	isChainValid(chain){
		for(let i = 1; i < chain.length; i++){
			var currentBlock  = chain[i];
			const previousBlock = chain[i-1];

			if(currentBlock.hash !== Block.prototype.calculateHash.call(currentBlock)){

				return false;
			}

			if(currentBlock.previousHash !== previousBlock.hash){
				return false;
			}

			
		}
		return true;
	}

	getBlockchain(){
		return this.chain;
	}

	getBlockHeaders(){
		let headers = [];
		for(let block of this.chain){
			headers.push(block.blockHeader);
		}
		return headers;
	}

	getTransactions(){
		return this.completedTransactions;
	}
};

module.exports = Blockchain;