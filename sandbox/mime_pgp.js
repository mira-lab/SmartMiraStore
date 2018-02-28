'use strict'

// const PSS = require('../lib/paritySecretStore')
const PgpBuilder = require('pgpbuilder')

const ACCOUNT_ADDRESS = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'
const FILES_DIRECTORY = '/encrypted'
const NODE_T = 0

const os = require('os')
const fs = require('fs')
const ethUtil = require('ethereumjs-util')

// const paritySecretStore = new PSS(
//   ACCOUNT_ADDRESS,
//   ACCOUNT_PASSWORD,
//   null
//   // Buffer.from('8d3fc10ba2411e0896d6482ded49c4637b8b76c81ed05362d2d09171d29491bb', 'hex')
// )

// let filename = process.argv[3]
// if (filename === 'undefined') throw new Error('no filename specified!')
//
// let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')
// if (documentBody == null || documentBody === '') throw new Error('no file specified!')

let mode = process.argv[2]
if (mode === 'sign' || mode === 's') {
  var pgpbuilder = new PgpBuilder({
    host: 'HOST',
    port: 465, // or whatever port you want to use
    auth: {
      user: 'YOUR USERNAME',
      pass: 'YOUR PASSWORD',
      xoauth2: 'YOUR XOAUTH2 TOKEN' // (optional) If both password and xoauth2 token are set, the token is preferred.
    },
    ignoreTLS: false, // if set to true, do not issue STARTTLS even if the server supports it
    requireTLS: true, // if set to true, always use STARTTLS before authentication even if the host does not advertise it. If STARTTLS fails, do not try to authenticate the user
    secureConnection: true, // because why wouldn't you?
    ca: 'PIN THE CERTIFICATE OF YOUR PROVIDER OF CHOICE', // (optional) Only in conjunction with tcp-socket if you use TLS with forge. Pins a PEM-encoded certificate as a string. Please refer to the tcp-socket documentation for more information!
    tlsWorkerPath: 'path/to/' // (optional) Only in conjunction with tcp-socket if you use TLS with forge. . Indicates where the file for the TLS Web Worker is located. Please refer to the tcp-socket documentation for more information!
  });

  // set your private key to sign your message
  pgpbuilder.setPrivateKey({
    privateKeyArmored: 'ASCII ARMORED PRIVATE KEY',
    passphrase: 'PASSPHRASE'
  }, function(error) {
    // do something useful with the error
    console.log('\nSet private key fail: ', error)
  })

//   let storageId = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')
//
//   let proceedEncrypted = function (encrypted, storageId) {
//     console.log('\nStatus code: ', encrypted.status, '\nbody: ', encrypted.body)
//
//     let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
//     fs.writeFileSync(pathname + '.key', storageId)
//     fs.writeFileSync(pathname + '.enc', encrypted.body.result)
//   }
//
//   paritySecretStore.encode(storageId, documentBody, NODE_T, proceedEncrypted)
} else if (mode === 'decode' || mode === 'd') {
//   let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
//   let encrypted = fs.readFileSync(pathname + '.enc').toString('ascii')
//   let storageId = fs.readFileSync(pathname + '.key').toString('ascii')
//
//   let shadowDecrypt = function (decrypted) {
//     console.log(decrypted)
//   }

  paritySecretStore.shadowDecode(storageId, encrypted, shadowDecrypt)
} else if (mode === 'acc-export' || mode === 'a') {
  // paritySecretStore.exportAccount()
} else {
  // console.log('Usage are: parity_secret_storage [mode={<e>ncode, <d>ecode, <a>cc-export}] [filename]')
}
