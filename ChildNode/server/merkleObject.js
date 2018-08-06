var Transaction = require('./transaction')
const  SHA256 = require('crypto-js/sha256');

class MerkleObject{
	constructor(transaction){
		this.transaction = transaction;
		this.hash = SHA256(Date.now() + transaction.fromAddress + transaction.toAddress + transaction.amount).toString();
		this.merkleRoot = '';
	}

	toString(){
		return this.hash;
	}

}

module.exports = MerkleObject;
