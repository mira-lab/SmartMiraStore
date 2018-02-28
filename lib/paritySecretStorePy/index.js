/**
 * Usage of Parity's SecretStore for nodejs.
 * @author Andrey Tarasenko (andrey.installmonster@gmail.com)
 */

const { EventEmitter } = require('events')
const os = require('os')
const ethKey = require('keythereum')
const findRemoveSync = require('find-remove')
const querystring = require('querystring')
const http = require('http')
const unirest = require('unirest')
const secp256k1 = require('secp256k1')
const secp256k1_curve = require('elliptic-curve').secp256k1
const EthereumEncryption = require('ethereum-encryption')

const PythonShell = require('python-shell')

const optionsPyS = {
  mode: 'text',
  pythonPath: '/usr/bin',
  pythonOptions: ['-u'],
  scriptPath: '/home/moneystream/PHP/ethereumjs-devp2p/python-scripts',
  args: ['value1', 'value2', 'value3']
}

module.exports = class PSS extends EventEmitter {
  constructor (address, password, privateKey) {
    super()

    this.DIRECTORIES = {keyDirectory: '/parity-keys', filesDirectory: '/encrypted'}
    this.NETWORKING = {host: 'http://127.0.0.1', portSS: '8082', portJsonRpc: '8545'}

    this._address = address.toLowerCase()
    this._password = password

    this._privateKey = (privateKey === null)
      ? this.getPrivateKey(this._address, this._password, this.DIRECTORIES.keyDirectory)
      : privateKey

    // console.log(this._privateKey)
  }

  pythonLibRun () {
//     PythonShell.run('generate.py', optionsPyS, function (err, results) {
//       if (err) throw err
//       // results is an array consisting of messages collected during execution
//       console.log('results: %j', results)
//     })

    let pyshell = new PythonShell('generate.py', optionsPyS)

// sends a message to the Python script via stdin
    pyshell.send('hello')

    pyshell.on('message', function (message) {
      // received a message sent from the Python script (a simple "print" statement)
      console.log(message)
    })

// end the input stream and allow the process to exit
    pyshell.end(function (err) {
      if (err) throw err
      console.log('finished')
    })
  }

  /**
   * Recover private key from address + pwd, & key file exported from wallet.
   * @param {string} address Hex address of account.
   * @param {string} pwd Password for account.
   * @param {string} keydir Key directory relative to home dir.
   * @return {string} Recovered private key.
   */
  getPrivateKey (address, pwd, keydir) {
    let keyObj = ethKey.importFromFile(address, os.homedir() + keydir)
    return ethKey.recover(pwd, keyObj)
  }

  /**
   * Decode encrypted data by storageId
   * @param storageId Shadow mode get key
   * @param encrypted Encrypted string
   * @param cb Callback when get decoded body from KeyServer
   */
  shadowDecode (storageId, encrypted, cb) {
    const self = this
    let signedStorageId = secp256k1.sign(Buffer.from(storageId, 'hex'), this._privateKey)

    let getShadowKey = new Promise(function (resolve) {
      let Request = unirest.get(self.NETWORKING.host + ':' + self.NETWORKING.portSS +
        '/shadow/' + storageId + '/' + signedStorageId.signature.toString('hex') + '00')
      Request.end(documentKey => resolve(documentKey.body))
    })

    getShadowKey.then(function (shadowKeys) {
      let dataBinary = '{"jsonrpc": "2.0", "method": "secretstore_shadowDecrypt", "params": ["' +
        self._address + '", "' + self._password + '", "' +
        shadowKeys.decrypted_secret + '", "' + shadowKeys.common_point +
        '", ["' + shadowKeys.decrypt_shadows + '"], "' +
        encrypted + '"], "id":2 }'

      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc + '/')
      Request.headers({'Content-Type': 'application/json'}).send(dataBinary).end(function (data) {
        cb(Buffer.from(data.body.result.replace('0x', ''), 'hex').toString('utf8'))
      })
    },
    function (err) {
      console.log(err)
    })
  }

  /**
   * Create document key & encrypt data
   * @param storageId
   * @param data
   * @param T
   * @param cb
   */
  encode (storageRaw, data, T, cb) {
    const self = this
    // let signedStorageId = secp256k1.sign(Buffer.from(storageId, 'hex'), this._privateKey)
    // console.log(signedStorageId) // signedStorageId.signature.toString('hex')  +
    // console.log(storageId)  /*Buffer.from(storageId, 'hex')*/

    // let hello = '0x68656c6c6f20776f726c64'

    let hashStorageId = new Promise(function (resolve) {
      let binary = '{"jsonrpc": "2.0", "method": "web3_sha3", "params": ["0x' + storageRaw + '"], "id":55 }'
      let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portJsonRpc)
      Request.headers({'Content-Type': 'application/json'})
      Request.send(binary)
      Request.end(hashed => resolve(hashed.body.result))  // storageRaw
    })

    hashStorageId.then(function (storageId) {
      // console.log(storageId, '\n')
      // let buf = Buffer.from(storageId.replace('0x', ''), 'hex')
      // let signedStorageId = secp256k1.sign(buf, self._privateKey, {canonical: true})
      let signedStorageId = EthereumEncryption.signHash(
        self._privateKey,
        Buffer.from(storageId.replace('0x', ''), 'hex')
      )

      // let signedStorageId = secp256k1_curve.signMessage(storageId, self._privateKey)

//       // get the public key in a compressed format
//       const pubKey = secp256k1.publicKeyCreate(self._privateKey)
//       console.log(signedStorageId, ' ', secp256k1.verify(buf, signedStorageId.signature, pubKey), '\n')

//       const EC = require('elliptic').ec
//
// // Create and initialize EC context
// // (better do it once and reuse it)
//       let ec = new EC('secp256k1')
//
//       let signedStorageId = ec.sign(buf, self._privateKey, 'hex', {canonical: true}).toDER('hex')
       console.log('\n', signedStorageId, '\n')

      let generateKey = new Promise(function (resolve) {
        let Request = unirest.post(self.NETWORKING.host + ':' + self.NETWORKING.portSS +
          '/' + storageId.replace('0x', '') + '/' + signedStorageId.toString('hex') + '00/' + T)
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
    })
  }

  exportAccount () {
    var self = this
    this.doRequest(8545, '/', 'POST', {
      'method': 'personal_unlockAccount',
      'params': [self._address, self._password, null],
      'id': 1,
      'jsonrpc': '2.0'
    }, function (data) {
      console.log('\nUnlock account status: ', data.result)

      if (data.result) {
        this.doRequest(8545, '/', 'POST', {
          'method': 'parity_exportAccount',
          'params': [self._address, self._password],
          'id': 2,
          'jsonrpc': '2.0'
        }, function (data) {
          console.log('\nAccount data: ', data.result)

          let keydir = os.homedir() + self.DIRECTORIES.keyDirectory + '/keystore'
          findRemoveSync(keydir, {files: '*.*'})
          ethKey.exportToFile(data.result, keydir)
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
      host: this.constants.host,
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
