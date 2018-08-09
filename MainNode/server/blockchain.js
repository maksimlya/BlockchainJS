const Transaction = require('./transaction');		// Uses our Transaction class
const Block = require('./block');					// Uses our Block class
const BlockHeader = require('./blockHeader');
const merkle = require('merkle');					// Uses merkle node module to handle operations with merkle tree
const  SHA256 = require('crypto-js/sha256');		// Uses crypto-js sha256 module to handle hash functions.
let elliptic = require('elliptic');					// Uses elliptic npm model ( for signing and validating transactions and blocks ())
let ec = new elliptic.ec('secp256k1');				// Tell elliptic to use ECDSA security mode ( same mode used by bitcoin's blockchain)


class Blockchain{
	constructor(){											// Blockchain's constructor
		this.chain = [this.createGenesisBlock()];			// When initiated, blockchain mines initial genesis block automatically
		this.difficulty = 4;								// Difficulty = amount of 0's in hash result that miners trying to find.
		this.transactionsPerBlock = 4;						// Each block contains max 4 transactions
		this.pendingTransactions = [];						// Pending transactions will be stored here.
		this.completedTransactions = [];					// Completed transactions will be stored here. It is safe to store them outside the blocks themselves, since they can be verified using the merkle trees hashing method.
		this.miningReward = 10;								// Defines mining reward for blocks
	}

	createGenesisBlock(){									// Creates initial block.
		return new Block("01/01/2018", [], "0");
	}

	getLatestBlock(){										// Returns last block in chain
		return this.chain[this.chain.length - 1];
	}

	minePendingTransactions(miningRewardAddress,keyPair){					// Function to mine block, and include any pending transactions, up to 4.

		let transactionHashes = [];
		let actualTransactions = [];
		let pendingTransactionsLength = this.pendingTransactions.length;		// Amount of pending transactions.
		let successTransactions = 0;											// Amount of verified transactions.
		for(var i = 0 ; i < 4 && i < pendingTransactionsLength ; i ++){			// Runs through max 4 transactions, verify them and store in the next block.
			let tempTransaction = this.pendingTransactions.shift();				// De-queue next pending transaction (Note that in cryptocurrencies system this list uses PriorityQueue model, to get the transaction that payed the highest transaction fee)
			if(this.validateSender(tempTransaction)){							// Validate the transaction (Make sure that the sender signed it with his private key)
			actualTransactions.push(tempTransaction);							// If valid, the transaction is included within next block.
			transactionHashes.push(tempTransaction.calculateHash());			// Stores hash of the transaction to be used for merkle tree.
			successTransactions++;												
		}
		}
		while(transactionHashes.length < 4)										// If the amount of pending transactions was less than 4, add some mock hashes values to fill the merkle tree (In this model we need 4 hashes to create it).
			transactionHashes.push(Date.now() + '0');

		var tree = merkle('sha256',false).sync(transactionHashes);				// Create the merkle tree based on the hashes from the transactions.
		for(var i = 0 ; i < 4 && i < successTransactions ; i ++){				// Add the successed transactions to the completed transactions structure.
			this.completedTransactions.push({hash: transactionHashes[i], merkleRoot: tree.root(), transaction: actualTransactions[i]});
		}
		
		let block = new Block(Date.now() ,tree.root(),this.getLatestBlock().blockHeader.hash);							// Create new block, providing it with timestamp, merkle root, and the hash from the last block.
		let signature = ec.sign(block.blockHeader.hash, keyPair.getPrivate(), "hex", {canonical: true});				// Sign the block with this node's private key.
		block.signature = signature;																					// Add the signature to the block
		block.merkleTree = tree;																						// Add the merkle tree to the block
		block.transactions = actualTransactions;																		// Add the successed transactions that were included in this block.
		block.mineBlock(this.difficulty);																				// Mine the block


		console.log('Block successfully mined!');
		this.chain.push(block);																							// Store the block in the chain.

		let rewardTransaction = new Transaction('Blockchain',miningRewardAddress,this.miningReward);					// Create transaction for mining reward (Note: the transaction itself will be included only within next block)
		rewardTransaction.publicKey = keyPair.getPublic();																
		let signReward = ec.sign(rewardTransaction.calculateHash(), keyPair.getPrivate(),"hex", {canonical: true});		// Sign the transaction with the node's private key
		rewardTransaction.signature = signReward;																		// Add the signature to the transaction
		this.pendingTransactions.push(rewardTransaction);																// Send it to the 'pending transactions'
		return block;																									// Return the mined block
	}

	addTransaction(transaction){												// Adds transaction to 'pending transactions' list
		this.pendingTransactions.push(transaction);
	}

	getProofElements(transaction){												// This function will return proof elements that associated with the asked transaction
		let controlHashes = [];													// The needed hashes will be stored in this list in sorted order.
		let merkleRoot = transaction.merkleRoot;
		
		for(const block of this.chain){
			if(block.blockHeader.merkleRoot === merkleRoot){
				var allHashes = block.merkleTree.getProofPath(0);				// Ask merkle to provide proof path for left-sided pair of leaves.
				switch(transaction.hash){												//Checks if our transaction is any of the left-sided leaves
					case allHashes[0].left: 			
					controlHashes.push({hash: allHashes[0].right,position: 'right'});	// Then it adds the neighbor leave
					controlHashes.push({hash: allHashes[1].right,position: 'right'});	// And the result hash of the right-sided pair of leaves
					break;
					case allHashes[0].right:
					controlHashes.push({hash: allHashes[0].left,position: 'left'});
					controlHashes.push({hash: allHashes[1].right,position: 'right'});
					break;
				}
				allHashes = block.merkleTree.getProofPath(2);					// Ask merkle to provide proof path for right-sided pair of leaves.
				switch(transaction.hash){
					case allHashes[0].left:
					controlHashes.push({hash: allHashes[0].right,position: 'right'});	// As before, it returns the right values to be able to re-make the merkle root hash result...
					controlHashes.push({hash: allHashes[1].right,position: 'left'});
					break;
					case allHashes[0].right:
					controlHashes.push({hash: allHashes[0].left,position: 'left'});
					controlHashes.push({hash: allHashes[1].right,position: 'left'});
					break;
				}
				
			}
		}
		
		return controlHashes;					// Returns the control hashes
	}

	validateTransaction(transaction,controlHashes){												// This function will take the transaction we want to check, and the control hashes that we got from previous function,
		let hashedElement = '';																	// and will try to re-calculate the merkle root. If we get same result as our merkle root, means the transaction was included in the block.
		if(controlHashes[0].position === 'left')												// Checks leaves placement (left/right) because SHA256 will provide different results based on placement of our values.
			hashedElement = SHA256(controlHashes[0].hash + transaction.hash).toString();
		else
			hashedElement = SHA256(transaction.hash + controlHashes[0].hash).toString();

		if(controlHashes[1].position === 'left')
			hashedElement = SHA256(controlHashes[1].hash + hashedElement).toString();
		else
			hashedElement = SHA256(hashedElement + controlHashes[1].hash).toString();

		if(hashedElement === transaction.merkleRoot)											// Return true = transaction is 100% in the block.
			return true;
		else return false;

	}

	validateSender(transaction){											// This function will validate the sender's identity by checking the transaction's signature with the sender's public key.
                if(transaction == null)
                    return false;
		var key = ec.keyFromPublic(transaction.publicKey, 'hex');
		let validSig = ec.verify(transaction.calculateHash(), transaction.signature, key);			// Only if it was signed with the corrent private key, the verification will pass.
		return validSig;
	}

	

	getBalanceOfAddress(address){													// This function runs through all completed transactions and fills the addresse's balance based on 'to'/'from' placements of deal
		let balance = 0;

		for(const transaction of this.completedTransactions){
				let controlHashes = this.getProofElements(transaction);				
				if(!this.validateTransaction(transaction,controlHashes))			// Every transaction is verified that is included in blockchain.
					continue;
				if(transaction.transaction.fromAddress === address){
					balance -= parseInt(transaction.transaction.amount);
				}
				if(transaction.transaction.toAddress === address){
					balance += parseInt(transaction.transaction.amount);
				}
			
		}
		return balance;															// Returns addresse's balance
	}

	isChainValid(chain){													// This function checks that the blockchain is valid (Used in real-world blockchains to check that no changes were made to any of the blocks)
		for(let i = 1; i < chain.length; i++){								// If any of the data within the blocks was compromised, the blockchain will be rejected and thrown away, while another copy of it will be provided by neighbor node.
			var currentBlock  = chain[i];
			const previousBlock = chain[i-1];
		 	var checkHash = SHA256(currentBlock.blockHeader.id + currentBlock.blockHeader.previousHash + currentBlock.blockHeader.timestamp + currentBlock.blockHeader.merkleRoot + currentBlock.blockHeader.nonce).toString();
			
			if(currentBlock.blockHeader.hash !== checkHash){			// Check if any given block's hash is valid (If any of the data changes, block's hash will be changed as well and the block will be rejected and replaced)
				return false;
			}

			if(currentBlock.blockHeader.previousHash !== previousBlock.blockHeader.hash){								// CHecks that every block contains correct previous block's hash
				return false;
			}



			
			
		}
		return true;
	}

	getBlockchain(){			
		return this.chain;
	}

	getBlockHeaders(){							// Returns only block headers (used to share the blockchain with neighbor's child nodes)
		let headers = [];
		for(let block of this.chain){
			headers.push(block.blockHeader);
		}
		return headers;
	}

	getTransactions(){							// Provides all completed transactions
		return this.completedTransactions;
	}
	getPendingTransactions(){
		return this.pendingTransactions;
	}
};

module.exports = Blockchain;					//Export the module to be used in node class.