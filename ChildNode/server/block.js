const  SHA256 = require('crypto-js/sha256');
const BlockHeader = require('./blockHeader');


class Block{
	constructor(timestamp, merkleRoot, previousHash = ''){
                this.blockHeader = new BlockHeader(timestamp,merkleRoot,previousHash);
                this.transactions = [];
                this.merkleTree = [];
	}

		calculateHash(){
		return SHA256(this.id + this.previousHash + this.timestamp + this.merkleRoot + this.nonce).toString();			

	}
	
};

module.exports = Block; 
