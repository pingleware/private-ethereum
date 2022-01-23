"use strict";

const settings = require("config.json")("./settings.json");
const express = require("express");
const bodyParser = require("body-parser");
const {  JSONRPC, JSONRPCResponse, JSONRPCServer } = require("json-rpc-2.0");
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');

var admin = require("./namespace_admin.js");
var clique = require("./namespace_clique.js");
var debug = require("./namespace_debug.js");
var eth = require("./namespace_eth.js");
var les = require("./namespace_les.js");
var personal = require("./namespace_personal.js");
var miner = require("./namespace_miner.js");
var txpool = require("./namespace_txpool.js");

// Construct a schema, using GraphQL schema language - A PLACEHOLDER
var schema = buildSchema(`
  # Bytes32 is a 32 byte binary string, represented as 0x-prefixed hexadecimal.
  scalar Bytes32
  # Address is a 20 byte Ethereum address, represented as 0x-prefixed hexadecimal.
  scalar Address
  # Bytes is an arbitrary length binary string, represented as 0x-prefixed hexadecimal.
  # An empty byte string is represented as '0x'. Byte strings must have an even number of hexadecimal nybbles.
  scalar Bytes
  # BigInt is a large integer. Input is accepted as either a JSON number or as a string.
  # Strings may be either decimal or 0x-prefixed hexadecimal. Output values are all
  # 0x-prefixed hexadecimal.
  scalar BigInt
  # Long is a 64 bit unsigned integer.
  scalar Long
  schema {
    query: Query
    mutation: Mutation
  }

  # Account is an Ethereum account at a particular block.
  type Account {
      # Address is the address owning the account.
      address: Address!
      # Balance is the balance of the account, in wei.
      balance: BigInt!
      # TransactionCount is the number of transactions sent from this account,
      # or in the case of a contract, the number of contracts created. Otherwise
      # known as the nonce.
      transactionCount: Long!
      # Code contains the smart contract code for this account, if the account
      # is a (non-self-destructed) contract.
      code: Bytes!
      # Storage provides access to the storage of a contract account, indexed
      # by its 32 byte slot identifier.
      storage(slot: Bytes32!): Bytes32!
  }
  # Log is an Ethereum event log.
  type Log {
      # Index is the index of this log in the block.
      index: Int!
      # Account is the account which generated this log - this will always
      # be a contract account.
      account(block: Long): Account!
      # Topics is a list of 0-4 indexed topics for the log.
      topics: [Bytes32!]!
      # Data is unindexed data for this log.
      data: Bytes!
      # Transaction is the transaction that generated this log entry.
      transaction: Transaction!
  }
  #EIP-2718 
  type AccessTuple{
      address: Address!
      storageKeys : [Bytes32!]!
  }
  # Transaction is an Ethereum transaction.
  type Transaction {
      # Hash is the hash of this transaction.
      hash: Bytes32!
      # Nonce is the nonce of the account this transaction was generated with.
      nonce: Long!
      # Index is the index of this transaction in the parent block. This will
      # be null if the transaction has not yet been mined.
      index: Int
      # From is the account that sent this transaction - this will always be
      # an externally owned account.
      from(block: Long): Account!
      # To is the account the transaction was sent to. This is null for
      # contract-creating transactions.
      to(block: Long): Account
      # Value is the value, in wei, sent along with this transaction.
      value: BigInt!
      # GasPrice is the price offered to miners for gas, in wei per unit.
      gasPrice: BigInt!
      # MaxFeePerGas is the maximum fee per gas offered to include a transaction, in wei. 
  maxFeePerGas: BigInt
      # MaxPriorityFeePerGas is the maximum miner tip per gas offered to include a transaction, in wei. 
  maxPriorityFeePerGas: BigInt
      # Gas is the maximum amount of gas this transaction can consume.
      gas: Long!
      # InputData is the data supplied to the target of the transaction.
      inputData: Bytes!
      # Block is the block this transaction was mined in. This will be null if
      # the transaction has not yet been mined.
      block: Block
      # Status is the return status of the transaction. This will be 1 if the
      # transaction succeeded, or 0 if it failed (due to a revert, or due to
      # running out of gas). If the transaction has not yet been mined, this
      # field will be null.
      status: Long
      # GasUsed is the amount of gas that was used processing this transaction.
      # If the transaction has not yet been mined, this field will be null.
      gasUsed: Long
      # CumulativeGasUsed is the total gas used in the block up to and including
      # this transaction. If the transaction has not yet been mined, this field
      # will be null.
      cumulativeGasUsed: Long
      # EffectiveGasPrice is actual value per gas deducted from the sender's
      # account. Before EIP-1559, this is equal to the transaction's gas price.
      # After EIP-1559, it is baseFeePerGas + min(maxFeePerGas - baseFeePerGas,
      # maxPriorityFeePerGas). Legacy transactions and EIP-2930 transactions are
      # coerced into the EIP-1559 format by setting both maxFeePerGas and
      # maxPriorityFeePerGas as the transaction's gas price.
      effectiveGasPrice: BigInt
      # CreatedContract is the account that was created by a contract creation
      # transaction. If the transaction was not a contract creation transaction,
      # or it has not yet been mined, this field will be null.
      createdContract(block: Long): Account
      # Logs is a list of log entries emitted by this transaction. If the
      # transaction has not yet been mined, this field will be null.
      logs: [Log!]
      r: BigInt!
      s: BigInt!
      v: BigInt!
      #Envelope transaction support
      type: Int
      accessList: [AccessTuple!]
  }
  # BlockFilterCriteria encapsulates log filter criteria for a filter applied
  # to a single block.
  input BlockFilterCriteria {
      # Addresses is list of addresses that are of interest. If this list is
      # empty, results will not be filtered by address.
      addresses: [Address!]
      # Topics list restricts matches to particular event topics. Each event has a list
    # of topics. Topics matches a prefix of that list. An empty element array matches any
    # topic. Non-empty elements represent an alternative that matches any of the
    # contained topics.
    #
    # Examples:
    #  - [] or nil          matches any topic list
    #  - [[A]]              matches topic A in first position
    #  - [[], [B]]          matches any topic in first position, B in second position
    #  - [[A], [B]]         matches topic A in first position, B in second position
    #  - [[A, B]], [C, D]]  matches topic (A OR B) in first position, (C OR D) in second position
      topics: [[Bytes32!]!]
  }
  # Block is an Ethereum block.
  type Block {
      # Number is the number of this block, starting at 0 for the genesis block.
      number: Long!
      # Hash is the block hash of this block.
      hash: Bytes32!
      # Parent is the parent block of this block.
      parent: Block
      # Nonce is the block nonce, an 8 byte sequence determined by the miner.
      nonce: Bytes!
      # TransactionsRoot is the keccak256 hash of the root of the trie of transactions in this block.
      transactionsRoot: Bytes32!
      # TransactionCount is the number of transactions in this block. if
      # transactions are not available for this block, this field will be null.
      transactionCount: Int
      # StateRoot is the keccak256 hash of the state trie after this block was processed.
      stateRoot: Bytes32!
      # ReceiptsRoot is the keccak256 hash of the trie of transaction receipts in this block.
      receiptsRoot: Bytes32!
      # Miner is the account that mined this block.
      miner(block: Long): Account!
      # ExtraData is an arbitrary data field supplied by the miner.
      extraData: Bytes!
      # GasLimit is the maximum amount of gas that was available to transactions in this block.
      gasLimit: Long!
      # GasUsed is the amount of gas that was used executing transactions in this block.
      gasUsed: Long!
      # BaseFeePerGas is the fee perunit of gas burned by the protocol in this block.
  baseFeePerGas: BigInt
      # Timestamp is the unix timestamp at which this block was mined.
      timestamp: Long!
      # LogsBloom is a bloom filter that can be used to check if a block may
      # contain log entries matching a filter.
      logsBloom: Bytes!
      # MixHash is the hash that was used as an input to the PoW process.
      mixHash: Bytes32!
      # Difficulty is a measure of the difficulty of mining this block.
      difficulty: BigInt!
      # TotalDifficulty is the sum of all difficulty values up to and including
      # this block.
      totalDifficulty: BigInt!
      # OmmerCount is the number of ommers (AKA uncles) associated with this
      # block. If ommers are unavailable, this field will be null.
      ommerCount: Int
      # Ommers is a list of ommer (AKA uncle) blocks associated with this block.
      # If ommers are unavailable, this field will be null. Depending on your
      # node, the transactions, transactionAt, transactionCount, ommers,
      # ommerCount and ommerAt fields may not be available on any ommer blocks.
      ommers: [Block]
      # OmmerAt returns the ommer (AKA uncle) at the specified index. If ommers
      # are unavailable, or the index is out of bounds, this field will be null.
      ommerAt(index: Int!): Block
      # OmmerHash is the keccak256 hash of all the ommers (AKA uncles)
      # associated with this block.
      ommerHash: Bytes32!
      # Transactions is a list of transactions associated with this block. If
      # transactions are unavailable for this block, this field will be null.
      transactions: [Transaction!]
      # TransactionAt returns the transaction at the specified index. If
      # transactions are unavailable for this block, or if the index is out of
      # bounds, this field will be null.
      transactionAt(index: Int!): Transaction
      # Logs returns a filtered set of logs from this block.
      logs(filter: BlockFilterCriteria!): [Log!]!
      # Account fetches an Ethereum account at the current block's state.
      account(address: Address!): Account!
      # Call executes a local call operation at the current block's state.
      call(data: CallData!): CallResult
      # EstimateGas estimates the amount of gas that will be required for
      # successful execution of a transaction at the current block's state.
      estimateGas(data: CallData!): Long!
  }
  # CallData represents the data associated with a local contract call.
  # All fields are optional.
  input CallData {
      # From is the address making the call.
      from: Address
      # To is the address the call is sent to.
      to: Address
      # Gas is the amount of gas sent with the call.
      gas: Long
      # GasPrice is the price, in wei, offered for each unit of gas.
      gasPrice: BigInt
      # MaxFeePerGas is the maximum fee per gas offered, in wei. 
  maxFeePerGas: BigInt
      # MaxPriorityFeePerGas is the maximum miner tip per gas offered, in wei. 
  maxPriorityFeePerGas: BigInt
      # Value is the value, in wei, sent along with the call.
      value: BigInt
      # Data is the data sent to the callee.
      data: Bytes
  }
  # CallResult is the result of a local call operation.
  type CallResult {
      # Data is the return data of the called contract.
      data: Bytes!
      # GasUsed is the amount of gas used by the call, after any refunds.
      gasUsed: Long!
      # Status is the result of the call - 1 for success or 0 for failure.
      status: Long!
  }
  # FilterCriteria encapsulates log filter criteria for searching log entries.
  input FilterCriteria {
      # FromBlock is the block at which to start searching, inclusive. Defaults
      # to the latest block if not supplied.
      fromBlock: Long
      # ToBlock is the block at which to stop searching, inclusive. Defaults
      # to the latest block if not supplied.
      toBlock: Long
      # Addresses is a list of addresses that are of interest. If this list is
      # empty, results will not be filtered by address.
      addresses: [Address!]
      # Topics list restricts matches to particular event topics. Each event has a list
    # of topics. Topics matches a prefix of that list. An empty element array matches any
    # topic. Non-empty elements represent an alternative that matches any of the
    # contained topics.
    #
    # Examples:
    #  - [] or nil          matches any topic list
    #  - [[A]]              matches topic A in first position
    #  - [[], [B]]          matches any topic in first position, B in second position
    #  - [[A], [B]]         matches topic A in first position, B in second position
    #  - [[A, B]], [C, D]]  matches topic (A OR B) in first position, (C OR D) in second position
      topics: [[Bytes32!]!]
  }
  # SyncState contains the current synchronisation state of the client.
  type SyncState{
      # StartingBlock is the block number at which synchronisation started.
      startingBlock: Long!
      # CurrentBlock is the point at which synchronisation has presently reached.
      currentBlock: Long!
      # HighestBlock is the latest known block number.
      highestBlock: Long!
  }
  # Pending represents the current pending state.
  type Pending {
    # TransactionCount is the number of transactions in the pending state.
    transactionCount: Int!
    # Transactions is a list of transactions in the current pending state.
    transactions: [Transaction!]
    # Account fetches an Ethereum account for the pending state.
    account(address: Address!): Account!
    # Call executes a local call operation for the pending state.
    call(data: CallData!): CallResult
    # EstimateGas estimates the amount of gas that will be required for
    # successful execution of a transaction for the pending state.
    estimateGas(data: CallData!): Long!
  }  

  type Query {
      # Block fetches an Ethereum block by number or by hash. If neither is
      # supplied, the most recent known block is returned.
      block(number: Long, hash: Bytes32): Block
      # Blocks returns all the blocks between two numbers, inclusive. If
      # to is not supplied, it defaults to the most recent known block.
      blocks(from: Long, to: Long): [Block!]!
      # Pending returns the current pending state.
      pending: Pending!
      # Transaction returns a transaction specified by its hash.
      transaction(hash: Bytes32!): Transaction
      # Logs returns log entries matching the provided filter.
      logs(filter: FilterCriteria!): [Log!]!
      # GasPrice returns the node's estimate of a gas price sufficient to
      # ensure a transaction is mined in a timely fashion.
      gasPrice: BigInt!
      # MaxPriorityFeePerGas returns the node's estimate of a gas tip sufficient
      # to ensure a transaction is mined in a timely fashion.
      maxPriorityFeePerGas: BigInt!
      # Syncing returns information on the current synchronisation state.
      syncing: SyncState
      # ChainID returns the current chain ID for transaction replay protection.
      chainID: BigInt!
    }

    type Mutation {
      # SendRawTransaction sends an RLP-encoded transaction to the network.
      sendRawTransaction(data: Bytes!): Bytes32!
    }
`);

// The root provides a resolver function for each API endpoint - A PLACEHOLDER
var root = {
  query: () => {
    return `{"block":{"number":6004069}}`;
  },
};

const server = new JSONRPCServer();

// First parameter is a method name.
// Second parameter is a method itself.
// A method takes JSON-RPC params and returns a result.
// It can also return a promise of the result.
server.addMethod("echo", ({ text }) => text);
server.addMethod("log", ({ message }) => console.log(message));

// ADMIN Namespance
server.addMethod("admin_addPeer", admin.admin_addPeer);
server.addMethod("admin_datadir", admin.admin_datadir);
server.addMethod("admin_nodeInfo", admin.admin_nodeInfo);
server.addMethod("admin_peers", admin.admin_peers);
server.addMethod("admin_startRPC", admin.admin_startRPC);
server.addMethod("admin_startWS", admin.admin_startWS);
server.addMethod("admin_stopRPC", admin.admin_stopRPC);
server.addMethod("admin_stopWS", admin.admin_stopWS);
// CLIQUE Namespace
server.addMethod("clique_discard", clique.clique_discard);
server.addMethod("clique_getSigners", clique.clique_getSigners);
server.addMethod("clique_getSnapshot", clique.clique_getSnapshot);
server.addMethod("clique_getSnapshotAtHash", clique.clique_getSnapshotAtHash);
server.addMethod("clique_proposals", clique.clique_proposals);
server.addMethod("clique_propose", clique.clique_propose);
server.addMethod("clique_status", clique.clique_status);
// DEBUG Namespace
server.addMethod("debug_backtraceAt", debug.debug_backtraceAt);
server.addMethod("debug_blockProfile", debug.debug_blockProfile);
server.addMethod("debug_cpuProfile", debug.debug_cpuProfile);
server.addMethod("debug_dumpBlock", debug.debug_dumpBlock);
server.addMethod("debug_gcStats", debug.debug_gcStats);
server.addMethod("debug_getBlockRlp", debug.debug_getBlockRlp);
server.addMethod("debug_goTrace", debug.debug_goTrace);
server.addMethod("debug_memStats", debug.debug_memStats);
server.addMethod("debug_seedHash", debug.debug_seedHash);
server.addMethod("debug_setBlockProfileRate", debug.debug_setBlockProfileRate);
server.addMethod("debug_setHead", debug.debug_setHead);
server.addMethod("debug_stacks", debug.debug_stacks);
server.addMethod("debug_standardTraceBadBlockToFile", debug.debug_standardTraceBadBlockToFile);
server.addMethod("debug_standardTraceBlockToFile", debug.debug_standardTraceBlockToFile);
server.addMethod("debug_startCPUProfile", debug.debug_startCPUProfile);
server.addMethod("debug_startGoTrace", debug.debug_startGoTrace);
server.addMethod("debug_stopCPUProfile", debug.debug_stopCPUProfile);
server.addMethod("debug_stopGoTrace", debug.debug_stopGoTrace);
server.addMethod("debug_traceBlock", debug.debug_traceBlock);
server.addMethod("debug_traceBlockByHash", debug.debug_traceBlockByHash);
server.addMethod("debug_traceBlockByNumber", debug.debug_traceBlockByNumber);
server.addMethod("debug_traceBlockFromFile", debug.debug_traceBlockFromFile);
server.addMethod("debug_traceCall", debug.debug_traceCall);
server.addMethod("debug_traceTransaction", debug.debug_traceTransaction);
server.addMethod("debug_verbosity", debug.debug_verbosity);
server.addMethod("debug_vmodule", debug.debug_vmodule);
server.addMethod("debug_writeBlockProfile", debug.debug_writeBlockProfile);
server.addMethod("debug_writeMemProfile", debug.debug_writeMemProfile);
// ETH Namespace
server.addMethod("eth_call", eth.eth_call);
server.addMethod("eth_subscribe", eth.subscribe);
server.addMethod("eth_unsubscribe", eth.unsubscribe);
server.addMethod("eth_createAccessList", eth.eth_createAccessList);
// LES Namespace
server.addMethod("les_addBalance", les.les_addBalance);
server.addMethod("les_clientInfo", les.les_clientInfo);
server.addMethod("les_getCheckpoint", les.les_getCheckpoint);
server.addMethod("les_getCheckpointContractAddress", les.les_getCheckpointContractAddress);
server.addMethod("les_latestCheckpoint", les.les_latestCheckpoint);
server.addMethod("les_priorityClientInfo", les.les_priorityClientInfo);
server.addMethod("les_serverInfo", les.les_serverInfo);
server.addMethod("les_setClientParams", les.les_setClientParams);
server.addMethod("les_setDefaultParams", les.les_setDefaultParams);
//PERSONAL Namespace
server.addMethod("personal_ecRecover", personal.personal_ecRecover);
server.addMethod("personal_importRawKey", personal.personal_importRawKey);
server.addMethod("personal_listAccounts", personal.personal_listAccounts);
server.addMethod("personal_lockAccount", personal.personal_lockAccount);
server.addMethod("personal_newAccount", personal.personal_newAccount);
server.addMethod("personal_sendTransaction", personal.personal_sendTransaction);
server.addMethod("personal_sign", personal.personal_sign);
server.addMethod("personal_unlockAccount", personal.personal_unlockAccount);
// MINER Namespace
server.addMethod("miner_getHashrate", miner.miner_getHashrate);
server.addMethod("miner_setEtherbase", miner.miner_setEtherbase);
server.addMethod("miner_setExtra", miner.miner_setExtra);
server.addMethod("miner_setGasLimit", miner.miner_setGasLimit);
server.addMethod("miner_setGasLimit", miner.miner_setGasPrice);
server.addMethod("miner_start", miner.miner_start);
server.addMethod("miner_stop", miner.miner_stop);
// TXPOOL Namespace
server.addMethod("txpool_content", txpool.txpool_content);
server.addMethod("txpool_inspect", txpool.txpool_inspect);
server.addMethod("txpool_status", txpool.txpool_status);

const app = express();
app.use(bodyParser.json());

/**
 * curl -X POST http://localhost:8545/graphql -H "Content-Type: application/json" --data '{ "query": "query { block { number } }" }'
 */
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

app.post("/", (req, res) => {
  const jsonRPCRequest = req.body;
  // server.receive takes a JSON-RPC request and returns a promise of a JSON-RPC response.
  // Alternatively, you can use server.receiveJSON, which takes JSON string as is (in this case req.body).
  server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse);
    } else {
      // If response is absent, it was a JSON-RPC notification method.
      // Respond with no content status (204).
      res.sendStatus(204);
    }
  });
});


app.listen(settings.port, function(){
    console.log(`Private Ethereum Server listening on port ${settings.port}`);
});