'use strict'

const PSS = require('../lib/paritySecretStore')

const ACCOUNT_ADDRESS = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'
const FILES_DIRECTORY = '/encrypted'
const NODE_T = 0

const os = require('os')
const fs = require('fs')
const ethUtil = require('ethereumjs-util')
// const zerorpc = require('zerorpc')

const paritySecretStore = new PSS(
  ACCOUNT_ADDRESS,
  ACCOUNT_PASSWORD,
  null
  // Buffer.from('8d3fc10ba2411e0896d6482ded49c4637b8b76c81ed05362d2d09171d29491bb', 'hex')
)

let filename = process.argv[3]
if (filename === 'undefined') throw new Error('no filename specified!')

let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')
if (documentBody == null || documentBody === '') throw new Error('no file specified!')

let mode = process.argv[2]
// if (mode === 'python' || mode === 'p') {
//   const client = new zerorpc.Client()
//   client.connect('tcp://127.0.0.1:4242')
//
//   let storageId = ethUtil.sha3(documentBody + new Date().toISOString() + 777).toString('hex')
//
//   console.log('\n' + storageId + ' \n')
//
//   client.invoke('hello', storageId, function(error, res, more) {
//     console.log(res.toString())
//   })
// } else

if (mode === 'multiple' || mode === 'm') {
  for (var i = 0; i < 20; i++) {
    let storageId = ethUtil.sha3(documentBody + new Date().toISOString() + (i * 777)).toString('hex')
    // let storageRaw = Buffer.from(documentBody + new Date().toISOString() + (i * 777), 'ascii')

    paritySecretStore.encodeRecovery(storageId, documentBody, NODE_T, function (encrypted, storageId) {
      console.log('\n' + storageId + ' ', encrypted.body.result || encrypted.body.error)
    })
  }
} else if (mode === 'encode' || mode === 'e') {
  let storageId = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')

  let proceedEncrypted = function (encrypted, storageId) {
    console.log('\nStatus code: ', encrypted.status, '\nbody: ', encrypted.body)

    let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
    fs.writeFileSync(pathname + '.key', storageId)
    fs.writeFileSync(pathname + '.enc', encrypted.body.result)
  }

  paritySecretStore.encodeRecovery(storageId, documentBody, NODE_T, proceedEncrypted)  // encode
} else if (mode === 'decode' || mode === 'd') {
  let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
  let encrypted = fs.readFileSync(pathname + '.enc').toString('ascii')
  let storageId = fs.readFileSync(pathname + '.key').toString('ascii')

  let shadowDecrypt = function (decrypted) {
    console.log(decrypted)
  }

  paritySecretStore.shadowDecode(storageId, encrypted, shadowDecrypt)
} else if (mode === 'acc-export' || mode === 'a') {
  paritySecretStore.exportAccount()
} else {
  console.log('Usage are: parity_secret_storage [mode={<e>ncode, <d>ecode, <a>cc-export}] [filename]')
}
