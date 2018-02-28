/**
 * Usage of Etherium Smart Contract(s) for nodejs.
 * @author Andrey Tarasenko (andrey.installmonster@gmail.com)
 */

const { EventEmitter } = require('events')
const os = require('os')
const keythereum = require('keythereum')
const findRemoveSync = require('find-remove')
const querystring = require('querystring')
const http = require('http')
const unirest = require('unirest')
const secp256k1 = require('secp256k1')
var Buffer = require('safe-buffer').Buffer
const ethUtil = require('ethereumjs-util')

module.exports = class ethContracts extends EventEmitter {
  constructor () {
    super()

    // this.DIRECTORIES = {keyDirectory: '/parity-keys', filesDirectory: '/encrypted'}
    // http://94.130.94.162
    this.NETWORKING = {host: 'http://127.0.0.1', portSS: '8082', portJsonRpc: '8545'}
    //
    // this._address = address.toLowerCase()
    // this._password = password
    //
    // this._privateKey = (privateKey === null)
    //   ? this.getPrivateKey(this._address, this._password, this.DIRECTORIES.keyDirectory)
    //   : privateKey
    // console.log(this._privateKey)
  }

  /**
   * Create data param for call method of deployed Contract (without gas spending)
   * @param signature
   * @param params
   * @returns {string}
   */
  constructCallMethodData (signature, params) {
    let data = '0x' + ethUtil.sha3(signature).toString('hex').substring(0, 8)

    if (params.length) {
      for (let i = 0; i < params.length; i++) {
        let str = params[i].toString(16).replace('0x', '')
        while (str.length < 64) {
          str = '0' + str
        }
        data += str
      }
    }

    return data
  }

  /**
   * Generate ethereum account (by given password)
   * @param password
   * @returns {{keyObject: *|Object, privateKey}}
   */
  generateAccount (password) {
    // dk: { privateKey: <Buffer ...>, iv: <Buffer ...>, salt: <Buffer ...> }
    let params = { keyBytes: 32, ivBytes: 16 }
    let dk = keythereum.create(params)

    let options = {
      kdf: 'pbkdf2',
      cipher: 'aes-128-ctr',
      kdfparams: {
        c: 262144,
        dklen: 32,
        prf: 'hmac-sha256'
      }
    }

    return {
      keyObject: keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options),
      privateKey: dk.privateKey
    }
  }

  /**
   * Executes a new message call immediately without creating a transaction on the block chain.
   * @param contractAddress
   * @param methodData
   * @returns {string}
   *
   curl --data '{"method":"eth_call","params":[{' +
      '"from":"0x407d73d8a49eeb85d32cf465507dd71d507100c1",' +
      '"to":"0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b","data":"0x186a0"}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json"
   -X POST localhost:8545
   *
   */
  contractMethodCall (contractAddress, methodData) {
    const self = this

    return new Promise(function (resolve) {
      let postData = '{"jsonrpc": "2.0", "method": "eth_call", "params": [{"to": "' + contractAddress +
          '", "data": "0x' + methodData + '"}], "id":777 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(postData)
      Request.end(response => resolve(response.body))
    })
    //
    // makeEthCall.then(function (response) {
    //   console.log('\nETH call response: ', response.result)
    // })
  }

  /**
   * Create parity account from secret
   * @param privateKey
   * @param password
   * @returns {Promise<any>}
   */
  createParityAccount (privateKey, password) {
    const self = this

    return new Promise(function (resolve) {
      let postData = '{"jsonrpc": "2.0", "method": "parity_newAccountFromSecret", "params": ["' + privateKey +
          '", "' + password + '"], "id":77 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(postData)
      Request.end(response => resolve(response.body))
    })
  }

  /**
   * Get contract body by address
   * @param contractAddress
   * @param quantity
   * @returns {Promise<any>}
   */
  getContractCode (contractAddress, quantity) {
    const self = this

    return new Promise(function (resolve) {
      let postData = '{"jsonrpc": "2.0", "method": "eth_getCode", "params": ["' + contractAddress +
          '", "' + quantity + '"], "id":555 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(postData)
      Request.end(response => resolve(response.body))
    })
    //
    // contractCode.then(function (response) {
    //   console.log('\nETH contract code: ', response.result)
    // })
  }

  /**
   * Create document key & encrypt data
   * @param storageId
   * @param data
   * @param T
   * @param cb
   */
  encodeRecovery (storageId, data, T, cb) {
    const self = this

    let signedStorageId = secp256k1.sign(Buffer.from(storageId, 'hex'), this._privateKey)

    let generateKey = new Promise(function (resolve) {
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portSS +
        '/' + storageId.replace('0x', '') + '/' + signedStorageId.signature.toString('hex') +
        ('0' + signedStorageId.recovery.toString(16)) +
        '/' + T)
      Request.end(documentKey => resolve(documentKey.body))
    })

    generateKey.then(function (documentKey) {
      console.log('\nSimultaneously generate server-side and document key:', documentKey, '\n')

      let binary = '{"jsonrpc": "2.0", "method": "secretstore_encrypt", "params": ["' +
        self._address + '", "' + self._password + '", "' + documentKey + '", "0x' + data + '"], "id":1111 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(binary)
      Request.end(encrypted => cb(encrypted, storageId))
    },
    function (err) {
      console.log(err)
    })
  }

//   signatureExport = function (sigObj) {
//     var r = Buffer.concat([Buffer.from([0]), sigObj.r])
//     for (var lenR = 33, posR = 0; lenR > 1 && r[posR] === 0x00 && !(r[posR + 1] & 0x80); --lenR, ++posR);
//
//     var s = Buffer.concat([Buffer.from([0]), sigObj.s])
//     for (var lenS = 33, posS = 0; lenS > 1 && s[posS] === 0x00 && !(s[posS + 1] & 0x80); --lenS, ++posS);
//
//     return bip66.encode(r.slice(posR), s.slice(posS))
//   }

  /**
   * Create document key & encrypt data
   * @param storageId
   * @param data
   * @param T
   * @param cb
   */
  encode (storageId, data, T, cb) {
    const self = this
    // let signedStorageId = secp256k1.sign(Buffer.from(storageId, 'hex'), this._privateKey)
    // console.log(signedStorageId) // signedStorageId.signature.toString('hex')  +
    // console.log(storageId)  /*Buffer.from(storageId, 'hex')*/

    // let hello = '0x68656c6c6f20776f726c64'

    let hashStorageId = new Promise(function (resolve) {
      let binary = '{"jsonrpc": "2.0", "method": "parity_signMessage", "params": ["' +
        self._address + '", "' + self._password + '", "0x' +
        storageId + '"], "id":55 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(binary)
      Request.end(signed => resolve(signed.body.result))
    })

    hashStorageId.then(function (signedStorageId) {
      console.log(signedStorageId, '\n')
//      let buf = Buffer.from(storageId.replace('0x', ''), 'hex')
//       // let signedStorageId = secp256k1.sign(buf, self._privateKey)
// //       let signedStorageId = EthereumEncryption.signHash(
// //         self._privateKey,
// //         Buffer.from(storageId.replace('0x', ''), 'hex')
// //       )
//
// //       let signedStorageId1 = secp256k1_curve.signMessage(storageId, self._privateKey)
// //       console.log('\n -> ', signedStorageId1, '\n')
//
// //       // get the public key in a compressed format
// //       const pubKey = secp256k1.publicKeyCreate(self._privateKey)
// //       console.log(signedStorageId, ' ', secp256k1.verify(buf, signedStorageId.signature, pubKey), '\n')
//
//       const EC = require('elliptic').ec
// //
// // // Create and initialize EC context
// // // (better do it once and reuse it)
//       let ec = new EC('secp256k1')
//      let signedStorageId = ec.sign(buf, self._privateKey, 'hex', {canonical: true}) // .toDER('hex')
//
//       let signedStorageRec = Buffer.from(signedStorageId, 'hex')
// //         {
// //         r: Buffer.from(signedStorageId.r.toString(16), 'hex'),
// //         s: Buffer.from(signedStorageId.s.toString(16), 'hex')
// //       }
//
//       console.log('\n', signedStorageId, '\n', signedStorageRec, '\n')
//
//       console.log('\n', self.signatureExport(signedStorageId), '\n')

      let generateKey = new Promise(function (resolve) {
        let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portSS +
          '/' + storageId.replace('0x', '') + '/' + signedStorageId.replace('0x', '').toString('hex') + '/' + T)
        Request.end(documentKey => resolve(documentKey.body))
      })

      generateKey.then(function (documentKey) {
        // console.log('\nSimultaneously generate server-side and document key:', documentKey, '\n')

        let binary = '{"jsonrpc": "2.0", "method": "secretstore_encrypt", "params": ["' +
          self._address + '", "' + self._password + '", "' + documentKey + '", "0x' + data + '"], "id":1111 }'
        let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
        Request.headers({'Content-Type': 'application/json'})
        Request.send(binary)
        Request.end(encrypted => cb(encrypted, storageId))
        },
      function (err) {
        console.log(err)
      })
    })
  }

  exportAccount () {
    var self = this
    self.doRequest(8545, '/', 'POST', {
      'method': 'personal_unlockAccount',
      'params': [self._address, self._password, null],
      'id': 1,
      'jsonrpc': '2.0'
    }, function (data) {
      console.log('\nUnlock account status: ', data.result)

      if (data.result) {
        self.doRequest(8545, '/', 'POST', {
          'method': 'parity_exportAccount',
          'params': [self._address, self._password],
          'id': 2,
          'jsonrpc': '2.0'
        }, function (data) {
          console.log('\nAccount data: ', data.result)

          let keydir = os.homedir() + self.DIRECTORIES.keyDirectory + '/keystore'
          findRemoveSync(keydir, {files: '*.*'})
          ethKey.exportToFile(data.result, keydir)

          console.log('\n', self.getPrivateKey(self._address, self._password, self.DIRECTORIES.keyDirectory).toString('hex'))
        })
      }
    })
  }

  doRequest (port, endpoint, method, data, success) {
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
      host: 'localhost',
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
}
