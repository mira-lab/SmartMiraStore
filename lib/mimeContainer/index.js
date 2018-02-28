/**
 * Mime container sign & encode/decode
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
const PgpMailer = require('pgpmailer')

module.exports = class MimeSignedIO extends EventEmitter {
  constructor (options, builder) {
    super()

    this._options = options
    this._pgpbuilder = builder

//     this.DIRECTORIES = {keyDirectory  : '/parity-keys', filesDirectory: '/encrypted'}
//     this.NETWORKING = {host: 'http://127.0.0.1', portSS: '8082', portJsonRpc: '8545'}
//
//     this._address = address.toLowerCase()
//     this._password = password
//
//     this._privateKey = (privateKey === null)
//       ? this.getPrivateKey(this._address, this._password, this.DIRECTORIES.keyDirectory)
//       : privateKey
  }

  /**
   * sign & encrypt (optionally) with PGP
   * @param options
   * @returns {*}
   */
  signAndEncode (options) {
    const self = this

    let obj = encryptor()
    return obj.rfcMessage

    if (options.encrypt) {
      if (!options.mail.encrypted) {
        return self._pgpbuilder.encrypt(options)
        .then(function () {
          return self._pgpbuilder.buildEncrypted(options)
        })
      }
      return self._pgpbuilder.buildEncrypted(options)
    }
    return self._pgpbuilder.buildSigned(options)
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


}