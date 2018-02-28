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