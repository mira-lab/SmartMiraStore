'use strict'
const ACCOUNT_ADDRESS_RAW = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'
const FILES_DIRECTORY = '/encrypted'
const NODE_T = 0
let ACCOUNT_ADDRESS = ACCOUNT_ADDRESS_RAW.toLowerCase()

const os = require('os')
const fs = require('fs')
const findRemoveSync = require('find-remove')
const querystring = require('querystring')
const http = require('http')
const unirest = require('unirest')
const ethKey = require('keythereum')
const ethUtil = require('ethereumjs-util')
const secp256k1 = require('secp256k1')

const body = 'hello, world! This is PGP encrypted MIME ';
const mail = {
  from: [{
    address: 'a@a.io'
  }],
  to: [{
    address: 'b@b.io'
  }, {
    address: 'c@c.io'
  }],
  subject: 'foobar',
  body: body,
  attachments: [{
    mimeType: 'text/x-markdown',
    filename: 'a.txt',
    content: expectedAttachmentPayload
  }]
};

//
// Helper Functions
//
function s2a (str) {
  var view = new Uint8Array(str.length)
  for (var i = 0, j = str.length; i < j; i++) {
    view[i] = str.charCodeAt(i)
  }
  return view
}








function getPrivateKey (address, pwd, keydir) {
  let keyObj = ethKey.importFromFile(address, os.homedir() + keydir)
  return ethKey.recover(pwd, keyObj)
}

function doRequest (host, port, endpoint, method, data, success) {
  let dataString = JSON.stringify(data)
  let headers = {}

  if (method === 'GET') {
    endpoint += '?' + querystring.stringify(data)
  } else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    }
  }
  let options = {
    host: host, // '127.0.0.1', // 'localhost',
    port: port,
    path: endpoint,
    method: method,
    headers: headers
  }

  let req = http.request(options, function (res) {
    res.setEncoding('utf-8')

    let responseString = ''

    res.on('data', function (data) {
      responseString += data
    })

    res.on('end', function () {
      // console.log(responseString)
      let responseObject = JSON.parse(responseString)
      success(responseObject)
    })
  })

  req.write(dataString)
  req.end()
}

function doEncode (filename, documentBody, T) {
  doRequest('localhost', 8545, '/', 'POST', {
    'method': 'personal_unlockAccount',
    'params': [ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, null],
    'id': 1,
    'jsonrpc': '2.0'
  }, function (data) {
    console.log('\nUnlock account status: ', data.result)

    if (data.result) {
      doRequest('localhost', 8545, '/', 'POST', {
        'method': 'parity_exportAccount',
        'params': [ACCOUNT_ADDRESS, ACCOUNT_PASSWORD],
        'id': 2,
        'jsonrpc': '2.0'
      }, function (data) {
        console.log('\nAccount data: ', data.result)

        let keydir = os.homedir() + KEY_DIRECTORY + '/keystore'
        findRemoveSync(keydir, {files: '*.*'})
        ethKey.exportToFile(data.result, keydir)

        encode(filename, documentBody, T)
      })
    }
  })
}

function proceedEncrypted (filename, data, hash) {
  console.log('\nStatus code: ', data.status, '\nbody: ', data.body)

  let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
  fs.writeFileSync(pathname + '.key', hash)
  fs.writeFileSync(pathname + '.enc', data.body.result)
}
// let Buffer.from(data.body.result, 'hex')
// console.log(parseInt())

function encode (filename, documentBody, T) {
  let privateKey = getPrivateKey(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, KEY_DIRECTORY)
  let address = ethKey.privateKeyToAddress(privateKey)
  console.log(`\nsecret is ${privateKey.toString('hex')},\naddress is ${address}`)

  let hash = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')
  let signedHash = secp256k1.sign(Buffer.from(hash, 'hex'), privateKey)
  console.log(`\nsign is ${signedHash.signature.toString('hex')}`)

  doRequest('localhost', 8082, '/' + hash + '/' + signedHash.signature.toString('hex') + '00/' + T, 'POST', {
  }, function (documentKey) {
    console.log('\nSimultaneously generate server-side and document key:', documentKey, '\n')

    let dataBinary = '{"jsonrpc": "2.0", "method": "secretstore_encrypt", "params": ["' + ACCOUNT_ADDRESS + '", "' +
      ACCOUNT_PASSWORD + '", "' + documentKey + '", "0x' + documentBody + '"], "id":777 }'
    let Request = unirest.post('http://127.0.0.1:8545/')
    Request.headers({'Content-Type': 'application/json'})
    Request.send(dataBinary)
    Request.end(data => proceedEncrypted(filename, data, hash))
  })
}

function proceedDecrypted (shadowKeys, encrypted) {
  let dataBinary = '{"jsonrpc": "2.0", "method": "secretstore_shadowDecrypt", "params": ["' +
    ACCOUNT_ADDRESS + '", "' + ACCOUNT_PASSWORD + '", "' +
    shadowKeys.decrypted_secret + '", "' + shadowKeys.common_point +
    '", ["' + shadowKeys.decrypt_shadows + '"], "' +
    encrypted +
    '"], "id":111 }'
  let Request = unirest.post('http://127.0.0.1:8545/')
  Request.headers({'Content-Type': 'application/json'})
  Request.send(dataBinary)
  Request.end(function (data) {
    console.log(Buffer.from(data.body.result.replace('0x', ''), 'hex').toString('utf8'))
  })
}

function decode (filename) {
  let privateKey = getPrivateKey(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, KEY_DIRECTORY)
  let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
  let encrypted = fs.readFileSync(pathname + '.enc').toString('ascii')
  let hash = fs.readFileSync(pathname + '.key').toString('ascii')
  let signedHash = secp256k1.sign(Buffer.from(hash, 'hex'), privateKey)

  console.log('\nhash is ', hash, ' signed is ', signedHash.signature.toString('hex'))

  let Request = unirest.get('http://127.0.0.1:8082/shadow/' + hash + '/' + signedHash.signature.toString('hex') + '00')
  Request.end(documentKey => proceedDecrypted(documentKey.body, encrypted))
}

let filename = process.argv[2]
if (filename === 'undefined') throw new Error('no filename specified!')

// let ws = new WebSocket('ws://127.0.0.1:8546', [], [])
//
// ws.on('open', function open () {
//   ws.send(
//     '{"id": 1, "jsonrpc": "2.0", "method": "personal_unlockAccount", "params": ["' +
//     ACCOUNT_ADDRESS + '","' +
//     ACCOUNT_PASSWORD + '", null]}'
//   )
// })
//
// ws.on('message', function incoming (data) {
//   console.log('received ', data)
// })

let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')
if (documentBody == null || documentBody === '') throw new Error('no file specified!')

let mode = process.argv[3]
if (mode === 'decode') {
  decode(filename)
} else {
  doEncode(filename, documentBody, NODE_T)
}
