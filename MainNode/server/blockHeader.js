const  SHA256 = require('crypto-js/sha256');
var id = 0;
class BlockHeader{
	constructor(timestamp, merkleRoot, previousHash = ''){
		this.id = id++;
		this.timestamp = timestamp;
		this.merkleRoot = merkleRoot;
		this.previousHash = previousHash;
		this.hash = this.calculateHash();
		this.nonce = 0;
	}

	calculateHash(){
		return SHA256(this.id + this.previousHash + this.timestamp + this.merkleRoot + this.nonce).toString();

	}
	
};

module.exports = BlockHeader;