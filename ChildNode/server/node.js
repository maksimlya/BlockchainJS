var Blockchain = require('./blockchain');
var Transaction = require('./transaction');

let elliptic = require('elliptic');
let ec = new elliptic.ec('secp256k1');

var WebSocket = require("ws");
var express = require('express');
var bodyParser = require('body-parser');



let myBlockchain = new Blockchain();

var http_port = process.env.HTTP_PORT || 3001;


var peers = ['ws://localhost:6000'];
var sockets = [];

var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/blocks', (req, res) => res.send('<pre>' + JSON.stringify(myBlockchain.getBlockchain(),null, ' ') + '</pre>'));
    app.get('/transactions', (req,res) => res.send('<pre>' + JSON.stringify(myBlockchain.getTransactions(),null, ' ') + '</pre>'));

    app.post('/addTransaction', (req,res) => {
        var from = req.body.from;
        var to = req.body.to;
        var amount = req.body.amount;
        if(myBlockchain.getBalanceOfAddress(from) >= amount){
        	var temp = new Transaction(from,to,amount);
        	myBlockchain.addTransaction(temp);
        	console.log('Transaction: from: ' + from + ' to:' + to + ' amount: ' + amount);
    }
    else{
    	console.log("Insufficient funds on " + from + " account");
    }
        res.end();
    
    	
    });
    app.post('/checkBalance', (req,res) =>{
    	var name = req.body.check;
    	var amount = myBlockchain.getBalanceOfAddress(name);
    	console.log(amount);
    	res.end();
    });
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress.replace(/^.*:/, '') + ':' + s._socket.remotePort));
       
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};



var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryAllMsg());
};

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});

var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([myBlockchain.getLatestBlock()])
});
var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(myBlockchain.chain)
});

var replaceChain = (newBlocks) => {
    if (myBlockchain.isChainValid(newBlocks)) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        myBlockchain.chain = newBlocks;
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};

var handleBlockchainResponse = (message) => {
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.id - b2.id));
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    console.log(receivedBlocks);
    var latestBlockHeld = myBlockchain.getLatestBlock();

    if(receivedBlocks.length > 1)
        replaceChain(receivedBlocks);
    else
        myBlockchain.chain.push(receivedBlocks);


};




connectToPeers(peers);
initHttpServer();
