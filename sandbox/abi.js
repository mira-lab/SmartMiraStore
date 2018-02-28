'use strict'
require('babel-register')
require('babel-polyfill')
const os = require('os')
const fs = require('fs')
const keypair = require('keypair')
const forge = require('node-forge')

const EthContracts = require('../lib/ethContracts')
const PSS = require('../lib/paritySecretStore')

const Web3 = require('web3')
const keythereum = require('keythereum')
const ethUtil = require('ethereumjs-util')

const ACCOUNT_ADDRESS = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

const ethContracts = new EthContracts()
const paritySecretStore = new PSS(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, null)

let filename = process.argv[3] || 'test'
let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')

let mode = process.argv[2]
let password = process.argv[4] || 'password'

if (mode === 'multiple' || mode === 'm') {
    for (var i = 0; i < 20; i++) {
        let storageId = ethUtil.sha3(documentBody + new Date().toISOString() + (i * 777)).toString('hex')
        // let storageRaw = Buffer.from(documentBody + new Date().toISOString() + (i * 777), 'ascii')

        paritySecretStore.encodeRecovery(storageId, documentBody, NODE_T, function (encrypted, storageId) {
            console.log('\n' + storageId + ' ', encrypted.body.result || encrypted.body.error)
        })
    }
} else if (mode === 'rsa' || mode === 'r') {
  let pair = keypair()
  let publicKey = forge.pki.publicKeyFromPem(pair.public)

  console.log(pair)
  console.log(publicKey)

} else if (mode === 'generate' || mode === 'g') {
  let account = ethContracts.generateAccount(password)
  let privKey = '0x' + keythereum.recover(password, account.keyObject).toString('hex')

  console.log(account.keyObject)
  console.log('\n private key = ' + privKey, ' || compare ', account.privateKey)
  console.log('\n address: ' + account.keyObject.address, ' || compare: ', keythereum.privateKeyToAddress(account.privateKey))

  let createParityAccount = ethContracts.createParityAccount(privKey, password)
  createParityAccount.then(response => console.log('added to parity as:', response.result))

} else if (mode === 'call-eth' || mode === 'c') {
  const permissionContractAdress = '0x3f85D0b6119B38b7E6B119F7550290fec4BE0e3c'
  const firstAccount = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'

  // process.argv[5] // ||
  let documentId = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')
  let data = ethContracts.constructCallMethodData(
      'addKeyAccess(address,bytes32,bytes32)', [firstAccount, documentId, '123456']
  )

  web3.eth.call({to: permissionContractAdress, data: data})
    .then(result => {
      console.log('documentId: ', documentId, 'result adding permission: ', (result > 0) ? ('success ' + result) : 'fail')

      let data = ethContracts.constructCallMethodData(
        'addKeyAccess(address,bytes32,bytes32)', [firstAccount, documentId, '97531']
      )

      web3.eth.call({to: permissionContractAdress, data: data})
        .then(result => {
          console.log('result adding SECOND permission (must be fail): ', result, (result > 0) ? 'success' : 'fail')
        })
    })

} else if (mode === 'access-add' || mode === 'a') {

  const abiPermissioning = require('../contracts/permissioning.json')
  const addressPermissioning = '0x3f85D0b6119B38b7E6B119F7550290fec4BE0e3c'
  const firstAccount = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'

  // process.argv[5] ||
  let documentId = '0x' + ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')
  let contractPermissioning = new web3.eth.Contract(abiPermissioning, addressPermissioning)

  // console.log(contractPermissioning)

//
//     // creation of contract object
//   let MyContract = web3.eth.Contract(abiPermissioning)
//
// // initiate contract for an address
//   let myContractInstance = MyContract.at('0x78e97bcc5b5dd9ed228fed7a4887c0d7287344a9')
//
//   let result = myContractInstance.addKeyAccess(firstAccount, documentId, '0x123456')
//   console.log(result) // '0x25434534534'

  // using the promise
  contractPermissioning.methods.addKeyAccess(firstAccount, documentId, '0x123456')
    .send({from: '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'})
    // .on('receipt', function(receipt){
    .then(function (receipt) {
      console.log(receipt)

      let data = ethContracts.constructCallMethodData(
        'addKeyAccess(address,bytes32,bytes32)', [firstAccount, documentId, '0x123456']
      )

      web3.eth.call({to: contractPermissioning, data: data})
        .then(result => {
          console.log('result adding permission: ', result)
        })

      // contractPermissioning.methods.addKeyAccess(firstAccount, documentId, '0x123456').call()
      //     .then(result => console.log(result))


        // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
    })

  // let result = contractPermissioning.call().addKeyAccess(firstAccount, documentId, '0x123456')
  // console.log(result)


} else if (mode === 'access-remove' || mode === 'r') {


}

// web3.eth.getBlock(2, function (error, result) {
//   if (!error) {
//     console.log(JSON.stringify(result))
//   } else {
//     console.error(error)
//   }
// })

// const oo7 = require('oo7')
// const Bond = oo7.Bond
//
// // creates a Bond instance
// var bonds = new Bond()
//
// const oo7parity = require('oo7-parity')
// const bonds = oo7parity.bonds
//
// bonds.findBlock(2)
// .then(
//   data => {
//     console.log(data)
//     process.exit(0)
//   }
// )   bonds.secretstore_acl_checker

//
//
// let callAddData = ethContracts.constructCallMethodData('return42()', [15, 20])
// console.log('\nprepared data for method Add contract call = ', callAddData)
//
// let code = ethContracts.getContractCode('0xb4c79daB8f259C7Aee6E5b2Aa729821864227e84', 'latest')
// /// console.log('\nCode body', code)
//
// let result = ethContracts.ethCall('0xb4c79daB8f259C7Aee6E5b2Aa729821864227e84', callAddData)
// /// console.log('\nCall result', result)
//
// const SecretStoreABI = require('../contracts/secret-store.json')

// let ssContract = bonds.makeContract('0x731a10897d267e19B34503aD902d0A29173Ba4B1', SecretStoreABI)

// bonds.registry.lookupAddress('secretstore_acl_checker', 'A')
// .then(
//   address => {
//     console.log('address SS = ' + address)
//     process.exit(0)
//   }
// )

// secretstore_server_set
// bonds.registry.lookupAddress('secretstore_acl_checker', 'A')
// .then(
//   data => {
//     console.log(data)
//     process.exit(0)
//   }
// )

// bonds.RegistryABI
// .then(
//   Contract => {
//     console.log(Contract)
//     process.exit(0)
//   }
// )

// bonds.makeContract(
//   bonds.registry.lookupAddress('githubhint', 'A'),
//   bonds.RegistryABI
// )
//
//
// bonds.registry.lookupAddress('gavofyork', 'A')



// do the setup
// const transport = new Api.Transport.Http('http://localhost:8545')
// const api = new Api(transport)
//
// api.eth
// .coinbase()
// .then((coinbase) => {
//   console.log(`The coinbase is ${coinbase}`)
// })
