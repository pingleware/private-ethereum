
function eth_subscribe(data) {
    console.log(data);
}

function eth_unsubscribe(data) {
    console.log(data);
}

/**
 * Example invocation:
 * 
 * curl --data '{"method":"eth_call","params":[{"to":"0xebe8efa441b9302a0d7eaecc277c09d20d684540","data":"0x45848dfc"},"latest"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
 * 
 * Expected Result:
 * 
 * {
 *   "id":      1,
 *   "jsonrpc": "2.0",
 *   "result":  "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000d9c9cd5f6779558b6e0ed4e6acf6b1947e7fa1f300000000000000000000000078d1ad571a1a09d60d9bbf25894b44e4c8859595000000000000000000000000286834935f4a8cfb4ff4c77d5770c2775ae2b0e7000000000000000000000000b86e2b0ab5a4b1373e40c51a7c712c70ba2f9f8e"
 * }
 */
function eth_call(data) {
    console.log(data);
    return "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000d9c9cd5f6779558b6e0ed4e6acf6b1947e7fa1f300000000000000000000000078d1ad571a1a09d60d9bbf25894b44e4c8859595000000000000000000000000286834935f4a8cfb4ff4c77d5770c2775ae2b0e7000000000000000000000000b86e2b0ab5a4b1373e40c51a7c712c70ba2f9f8e";
}

/**
 * Example invocation:
 * 
 * curl --data '{"method":"eth_createAccessList","params":[{"from": "0x8cd02c6cbd8375b39b06577f8d50c51d86e8d5cd", "data": "0x608060806080608155"}, "pending"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
 * 
 * Expected Result:
 * 
 * {
 *   "accessList": [
 *     {
 *       "address": "0xa02457e5dfd32bda5fc7e1f1b008aa5979568150",
 *       "storageKeys": [
 *         "0x0000000000000000000000000000000000000000000000000000000000000081",
 *       ]
 *     }
 *   ]
 *   "gasUsed": "0x125f8"
 * }
 * 
 */
function eth_createAccessList(data) {
    console.log(data);
    return { "accessList": [ { "address": "0xa02457e5dfd32bda5fc7e1f1b008aa5979568150", "storageKeys": ["0x0000000000000000000000000000000000000000000000000000000000000081"] }]};
}

module.exports = {
    eth_call,
    eth_subscribe,
    eth_unsubscribe,
    eth_createAccessList
};