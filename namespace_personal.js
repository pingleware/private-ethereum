
const settings = require("config.json")("./settings.json");
var mysql      = require('mysql');
var connection = mysql.createConnection(
  {
    host     : settings.database.host,
    database : settings.database.name,
    port     : settings.database.port,
    user     : settings.database.user,
    password : settings.database.pass,
    multipleStatements: true
  }
);

const keccak256 = require('keccak256');


var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var randomNumberString = function(length) {
    var text = "";
    var possible = "0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const { generateKeyPair } = require('crypto');


//  data[0] = private key
function personal_importRawKey(data){
    console.log(data);
    var privateKey = data[0];
    var passphrase = data[1];
}
function personal_listAccounts(data){
    console.log(data);
    var sql = 'SELECT address FROM accounts';
    connection.connect();
    connection.query(sql, function(error, results, fields){
        const output = Object.values(JSON.parse(JSON.stringify(results)));
        return output;
    })
    connection.end();
}
function personal_lockAccount(data){console.log(data);}
function personal_newAccount(data){
    console.log(data);
    generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: data[0]
        }
      }, (err, publicKey, privateKey) => {
        // Handle errors and use the generated key pair.
        var address = '0x' + keccak256(privateKey).toString('hex');
        var sql = `INSERT INTO accounts (address,transactionCount,code,passphrase,private_key) VALUES ('${address}',0,'','${data[0]}','${privateKey}');
        INSERT INTO balances (address, eth_balance) VALUES('${address}',0.00);`;

        connection.connect();
        connection.query(sql, function(error, results, fields){
            console.log([error, results, fields]);
            if (error) { console.log(error); return [sql, error]; }
            else return address;
        })
        connection.end();            
    });
}
function personal_unlockAccount(data){
    console.log(data);
}
/**
 * curl --silent --location --request POST 'http://localhost:8545' \
 * --header 'Content-Type: application/json' \
 * --data-raw '{
 *     "method": "personal_sendTransaction",
 *     "params": [
 *         {
 *             "from": "0x39af20a79ad9733f3c8383d1b608867edc2c008f55ef3a29110ef9157d25498d",
 *             "to": "0x5c5c4e6fcf6bef7eb51e2f9d69159c51f8c99846ddbe5be4518e0628a002a570",
 *             "value": 13.65
 *         },
 *         "passphrase"
 *     ],
 *     "id": 1,
 *     "jsonrpc": "2.0"
 * }'
 */
function personal_sendTransaction(data){
    connection.connect();
    var value = Number(data[0].value);
    var hash = '0x' + keccak256(JSON.stringify(data)).toString('hex');
    var nonce = Number(randomNumberString(5));
    var sql = `UPDATE balances SET eth_balance = GREATEST(0,eth_balance - ${value}) WHERE address='${data[0].from}' AND eth_balance >= ${value};
    UPDATE balances SET eth_balance = (eth_balance + ${value}) WHERE address='${data[0].to}';
    INSERT INTO blocks (hash,nonce,size,extra_data) VALUES ('${hash}','${nonce}',${JSON.stringify(data).length},'${JSON.stringify(data)}');
    INSERT INTO transactions (hash, from_address, to_address, value, nonce,block_hash) VALUES ('${hash}','${data[0].from}','${data[0].to}',${value},${nonce},'${hash}')`;

    console.log([keccak256(hash).toString('hex'),sql]);

    connection.query(sql, function(error, results, fields){
        if (error) {
            return error;
        } else {
            return "transfer successful, " + hash + ", " + sql;
        }
    });
    connection.end();

}
function personal_sign(data){console.log(data);}
function personal_ecRecover(data){console.log(data);}

module.exports = {
    personal_importRawKey,
    personal_listAccounts,
    personal_lockAccount,
    personal_newAccount,
    personal_unlockAccount,
    personal_sendTransaction,
    personal_sign,
    personal_ecRecover
}