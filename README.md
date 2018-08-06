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

Sammy:
private: 18c99d687362ba6ebd41eb50cafc81838b200971392b9ec9c158a7eebfae9622
public: 0455fcd3c08e5274be29c8eda05f6a8d5735bbe6c3f34028a16d820da0a82ed0ea48bb1fd8008abb87775e82b792711b4952ee25c14cfb2e2795bd795bc98c4411

Momo:
private: 73915210d917cb38f65802e91799243c3e5a11097a56640413e431b2ebdb19ac
public: 041931f5442127490dba3d30c08aef556e5cf5e9f2a0236d9599d0359bd43e69ef96932097ca83ddc7b2fa6796e774c24fc1010d39820db66aaa77a1ace0b5851c

Popo:
private: 3b474dd8a1dd3a13d7a486e03d3218b070a54e9ac7e24ae161431eacc6a9ea8d
public: 04334194db1b913e7f9bc7e3d43b8616d638a269c12de7b43eb4e267278979fb1c5e0b78ab2796110057f5dca7199b9deeed61952a6335e426302454f7fb3c93b6

Koko:
private: 72b9c1195c9db7de3b83243bd22ba734ba11880b980498f13a3079f516545b70
public: 0486247735db45c19d5945731f4b4e44944426bb777f921493fbcf3b1a6d1e9bdacf2308fc22ed0e4d04236d65c9a2131ddacbcbdfe428d8b868a5a22cb3fe95c9

In order to spend any address's coins, his private key must be entered in the corresponding field within the control panel, that demonstrates the blockchain's security





# BlockchainJS
