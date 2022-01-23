function personal_importRawKey(data){console.log(data);}
function personal_listAccounts(data){console.log(data);}
function personal_lockAccount(data){console.log(data);}
function personal_newAccount(data){console.log(data);}
function personal_unlockAccount(data){console.log(data);}
function personal_sendTransaction(data){console.log(data);}
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