const  SHA256 = require('crypto-js/sha256');



class Transaction{
	constructor(fromAddress, toAddress, amount){
		this.timestamp = Date.now();
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.amount = amount;
	}

	calculateHash(){
		return SHA256(this.timestamp + this.fromAddress + this.toAddress + this.amount).toString();

	}
};

module.exports = Transaction;