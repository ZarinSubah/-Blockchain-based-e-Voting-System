const EC = require('elliptic').ec;

const ec = new EC('secp256k1');


function generatePrivate() { //function to return private key
    const key = ec.genKeyPair();

    const privateKey = key.getPrivate('hex');

    return privateKey;
}


function generatePublic() {
    const key = ec.genKeyPair();

    const publicKey = key.getPublic('hex');

    return publicKey;
}

module.exports = { generatePrivate, generatePublic };
