# BlockchainJS
	Demo blockchain for studies purposes.

# Purposes
The application has 2 modules, a Parent node that stores the full blockchain, including the transactions and merkle tree, as well as it cappable of mining new blocks, and a Child node that only stores a chain of s block headers, and can only validate transactions (SPV equivalent).

# Installation
Go inside Parent node directory and run:
node install
node run

Access Control Panel with localhost:5000, there you can tell the node to mine block, check balance for each address, send transactions between addresses (Note that few blocks should be mined first so that 'Sammy' address will have some coins from mining rewards.

The blockchain data can be accessed through those lines in explorer:

localhost:3000/blocks
localhost:3000/transactions
localhost:3000/peers


For the Child Node, go inside Child node directory and run:
npm install
HTTP_PORT=3002 npm start

It is possible to run any amount of client, just each must have unique HTTP_PORT number

The child node does not have control panel, and it's data can only be accessed as:

localhost:HTTP_PORT/blocks

it will show all the synchronized blocks with the main node, but just the headers part.

# Information

The application has 4 initial users, each one is associated within his public/private keys:

The user's private/public keys can be found in keys.txt file

In order to spend any address's coins, his private key must be entered in the corresponding field within the control panel, that demonstrates the blockchain's security





# BlockchainJS
