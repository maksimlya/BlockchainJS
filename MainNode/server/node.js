var Blockchain = require('./blockchain');                // Uses our Blockchain module
var Transaction = require('./transaction');				// Uses our Transaction model

let elliptic = require('elliptic');						// Uses elliptic npm model ( for signing and validating transactions and blocks ())
let ec = new elliptic.ec('secp256k1');					// Tell elliptic to use ECDSA security mode ( same mode used by bitcoin's blockchain)

var WebSocket = require("ws");							// Websocket module to communicate with other nodes.
var express = require('express');						// Express and body-parser to handle http requests + page rendering
var bodyParser = require('body-parser');



//  In this program every address assosiated with a private/public key pair
//	So when we say 'address' in next sections, we mean the name of any of the 4 persons (Sammy,Momo,Popo,Koko)
//	Each of those addresses have their public keys that wrote here, and private keys that only they should know.

var sammyPublicKey = '0455fcd3c08e5274be29c8eda05f6a8d5735bbe6c3f34028a16d820da0a82ed0ea48bb1fd8008abb87775e82b792711b4952ee25c14cfb2e2795bd795bc98c4411';  // Define public keys for our users
var momoPublicKey = '041931f5442127490dba3d30c08aef556e5cf5e9f2a0236d9599d0359bd43e69ef96932097ca83ddc7b2fa6796e774c24fc1010d39820db66aaa77a1ace0b5851c';	// Those ones are used for validation of transactions
var popoPublicKey = '04334194db1b913e7f9bc7e3d43b8616d638a269c12de7b43eb4e267278979fb1c5e0b78ab2796110057f5dca7199b9deeed61952a6335e426302454f7fb3c93b6';	// Transaction will be valid only if it is signed with proper private key
var kokoPublicKey = '0486247735db45c19d5945731f4b4e44944426bb777f921493fbcf3b1a6d1e9bdacf2308fc22ed0e4d04236d65c9a2131ddacbcbdfe428d8b868a5a22cb3fe95c9';	// In that way, we validate the sender's identity, since the sender is the only person who should have the private key.

let keyPair = ec.keyFromPrivate("97ddae0f3a25b92268175400149d65d6887b9cefaf28ea2c078e05cdc15a3c0a");	// Generate key pair for current node (to validate blocks)


let myBlockchain = new Blockchain();										// Create block chain


var http_port = 3000;														// http port for http requests
var p2p_port = 6000;														// p2p port for communication with other nodes.
var peers = []																// initial peers list
var sockets = [];															// initial websocket list
var miningRewardAddress = 'Sammy';											// Define user who will get the reward for mining operations.

var MessageType = {															// Message type used for communication with other nodes
    QUERY_LATEST: 0,		// Get last block
    QUERY_ALL: 1,			// Show all blocks
    RESPONSE_BLOCKCHAIN: 2	// Get whole blockchain (used when peer connects to node that has many blocks, it asks the parent node for whole blockchain)
};

var initHttpServer = () => {								// Standart express operations
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/blocks', (req, res) => res.send('<pre>' + JSON.stringify(myBlockchain.getBlockchain(),null, ' ') + '</pre>'));				// All blocks in system can be viewed by  running   localhost:3000/blocks
    app.get('/blockHeaders', (req, res) => res.send('<pre>' + JSON.stringify(myBlockchain.getBlockHeaders(),null, ' ') + '</pre>'));		// All block headers in system can be viewed by running localhost:3000/blockHeaders
    app.get('/transactions', (req,res) => res.send('<pre>' + JSON.stringify(myBlockchain.getTransactions(),null, ' ') + '</pre>'));			// All completed transactions in system can be viewed by running localhost:3000/transactions
    app.get('/pendingTransactions', (req,res) => res.send('<pre>' + JSON.stringify(myBlockchain.getPendingTransactions(),null, ' ') + '</pre>'));
    app.post('/mineBlock', (req, res) => {														// Post method used to tell the node to mine next block.
        var newBlock = myBlockchain.minePendingTransactions(miningRewardAddress,keyPair);	// Tell blockChain to mine next block and include any pending transactions to it (Up to 4 transactions per block)
        broadcast(responseLatestMsg());										// Broadcast to all connected nodes that another block has been mined, and update them
       res.end();									
    });
    app.post('/addTransaction', (req,res) => {				// Post method used to send transaction to the node.
        var from = req.body.from;					// 'from' = address of sender
        
        var senderPublicKey = '';					// get the sender's public key (We defined them earlier on this page).
        if(from === 'Sammy')
            senderPublicKey = sammyPublicKey;
        if(from === 'Momo')
            senderPublicKey = momoPublicKey;
        if(from === 'Koko')
            senderPublicKey = kokoPublicKey;
        if(from === 'Popo')
            senderPublicKey = popoPublicKey;

        var to = req.body.to;					// 'to' = address of receiver.
        var amount = req.body.amount;			// 'amount' = amount of coins to send.
        if(myBlockchain.getBalanceOfAddress(from) >= amount){		// Ask the blockchain if the sender's address has enough coins that he wish to send.
        	let temp = new Transaction(from,to,amount);				// Create new temp transaction.
            let tempHash = Transaction.prototype.calculateHash.call(temp);	// Calculate the transaction's hash
            let signTransaction = ec.sign(tempHash, req.body.privateKey, "hex", {canonical: true});			// Sign the transaction with the provided private key ()
            temp.signature = signTransaction;					// Store the signature in temp transaction
            temp.publicKey = senderPublicKey;					// Store the sender's public key in temp transaction
        	myBlockchain.addTransaction(temp);					// Send the transaction in blockchain. It will be stored in 'pending transactions', and will be included in incoming blocks (only if the signature can be validated i/e only if the sender wrote his proper private key)
        	console.log('Transaction: from: ' + from + ' to:' + to + ' amount: ' + amount);		// Print to console that a transaction has been sent to the blockchain.
    }
    else{
    	console.log("Insufficient funds on " + from + " account");			// If the sending address doesn't have enough coins to send.
    }
        res.end();
    
    	
    });
    app.post('/checkBalance', (req,res) =>{							// Post command to check balance for any given Address
    	var name = req.body.check;								// 'check' = address we want to check  
    	var amount = myBlockchain.getBalanceOfAddress(name);	// Ask blockchain to check balance for a given address
    	console.log(name + ' balance: ' + amount);				// Prints the balance to console.
    	res.end();
    });
    app.get('/peers', (req, res) => {																				// Peers list can be accessed through  localhost:3000/peers
        res.send(sockets.map(s => s._socket.remoteAddress.replace(/^.*:/, '') + ':' + s._socket.remotePort));
       
    });
   
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));			// Listen for commands on port 3000
};

var initP2PServer = () => {													// Init p2p server for communication with nodes on port 6000.
    var server = new WebSocket.Server({port: p2p_port});					
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

var initConnection = (ws) => {         // To accept connection from another node.
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws) => {									// Handle requests from nodes (such as send last block, or send whole blockchain..)
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                console.log(myBlockchain.getBlockHeaders());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
               // handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {											// Handle connection lost with other node.
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};



var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});

var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([myBlockchain.getLatestBlock().blockHeader])
});
var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(myBlockchain.getBlockHeaders())
});

var replaceChain = (newBlocks) => {																				// Used to replace whole blockchain (usually used if any block in current node got compromised)
    if (myBlockchain.isChainValid(newBlocks) && newBlocks.length > myBlockchain.chain.length) {					// In that case, it would reject the current blockchain, and request copy of it from nearby node.
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');		// But bince this demo application has only 1 parent node, it has no use, maybe will be implemented it ongoing versions.
        myBlockchain.chain = newBlocks;
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};

var handleBlockchainResponse = (message) => {																				// Another function that has no use in our application
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.id - b2.id));										// It would update blockchain, if any other node would mine 
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];													// new block before this one, therefore it would have to accept 
    var latestBlockHeld = myBlockchain.getLatestBlock();																	// the longest chain.
    if (latestBlockReceived.id > latestBlockHeld.id) {																		// Since we have only 1 parent node(only 1 that is cappable of mining, it has no use as of now)
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.id + ' Peer got: ' + latestBlockReceived.id);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            myBlockchain.chain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than current blockchain. Do nothing');
    }
};





initHttpServer();									// Start Http server.
initP2PServer();									// Start p2p server.