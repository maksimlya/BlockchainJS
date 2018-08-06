const  SHA256 = require('crypto-js/sha256');
const BlockHeader = require('./blockHeader');


class Block{
	constructor(timestamp, merkleRoot, previousHash = ''){
                this.blockHeader = new BlockHeader(timestamp,merkleRoot,previousHash);
                this.transactions = [];
                this.merkleTree = [];
	}



	mineBlock(difficulty,signature,publicKey){
		while(this.blockHeader.hash.substring(0,difficulty) !== Array(difficulty + 1).join("0")){
			this.blockHeader.nonce++;
			this.blockHeader.hash = this.blockHeader.calculateHash();
		}
		console.log("Block mined: " + this.blockHeader.hash);
	}
	
};

module.exports = Block; 
