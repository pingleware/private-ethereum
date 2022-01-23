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
  type Query {
    query: String
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