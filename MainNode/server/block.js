var fs = require('fs');
var os = require('os');
const  SHA256 = require('crypto-js/sha256');
const BlockHeader = require('./blockHeader');


class Block{
	constructor(timestamp, merkleRoot, previousHash = ''){
                this.blockHeader = new BlockHeader(timestamp,merkleRoot,previousHash);
                this.transactions = [];
                this.merkleTree = [];

        if(this.blockHeader.id == 0){
        var block = JSON.stringify(this,null,2);
        if(!fs.existsSync('blocks/block0hash'))
			fs.writeFile('blocks/block0hash', this.blockHeader.hash, function(err, data){			// Keep genesis block hash just in case, through at the moment every genesis blocks have same hashes.
    		if (err) console.log(err);
    	
			});
	}

	}



	mineBlock(difficulty,signature,publicKey){																// Block mining function.
		while(this.blockHeader.hash.substring(0,difficulty) !== Array(difficulty + 1).join("0")){
			this.blockHeader.nonce++;
			this.blockHeader.hash = this.blockHeader.calculateHash();
		}

		fs.appendFileSync('blocks/indexes',this.blockHeader.id+' ',function(err,data){						// Store the block files in /blocks directory
			if (err) console.log(err);
		});

		var block = JSON.stringify(this,null,2);										// Turn each block into JSON object so we can parse it easily later.
		fs.writeFile('blocks/block' + this.blockHeader.id,block,function(err,data){
			if (err) console.log(err);
		});
	


		if(!fs.existsSync('blocks/merkleTrees'))										// Store the full merkle trees objects in files, right now only for learning aspects, our blockchain makes no use of these atm...
			fs.mkdirSync('blocks/merkleTrees');																																// Stored in blocks/merkleTrees folder.
    	fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '\n"merkleTree": {\n  "root": "' + this.merkleTree.root() + '",\n', function(err, data){		// Merkle root
    	if (err) console.log(err)});
    	fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '\n "level1": {\n' , function(err, data){	
    	if (err) console.log(err)});
		for(var leaf of this.merkleTree.level(1)){																											// 1st level hashes
		fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '"' + leaf + '"\n', function(err, data){
    	if (err) console.log(err)});
	}
		fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '\n "level2": {\n' , function(err, data){
    	if (err) console.log(err)});
		for(var leaf of this.merkleTree.level(2)){																											// 2nd lvl hashes ( the leaves )
		fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '"' + leaf + '"\n', function(err, data){
    	if (err) console.log(err)});
	}
    	fs.appendFileSync('blocks/merkleTrees/merkle' + this.blockHeader.id, '\n }',function(err,data){
    		if(err) console.log(err)});

		
		console.log("Block mined: " + this.blockHeader.hash);
	
	};

}


module.exports = Block; 
