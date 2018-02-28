const fetch = require('node-fetch')
const WebAssembly = require('webassembly')

fetch('https://www.hellorust.com/demos/add/add.wasm')
// fetch('/home/moneystream/PHP/ethereumjs-devp2p/add.wasm')
    .then(response => {
      // response.arrayBuffer()

      console.log(response.arrayBuffer())
    })
//     .then(bytes => WebAssembly.instantiate(bytes, {}))
//     .then(results => {
//       results.instance.exports.add_one(41)
//     })

// const fs = require('fs');
// const buf = fs.readFileSync('./add.wasm');
// const lib = Wasm.instantiateModule(new Uint8Array(buf)).exports;
//
// console.log( lib.add_one(41) );

// console.log('TRY create Wasm')
//
// var wasm = require('wasm')
//
// var fnStr = wasm('./target/wasm32-unknown-emscripten/release/deps/ss.wasm')

// wasm = require('./runwasm.js')
// wasm
// .loadWebAssembly('target/wasm32-unknown-emscripten/release/deps/ss.wasm')
// .then(i => console.log(i.exports.encrypt_document(
//   Buffer.from("cac6c205eb06c8308d65156ff6c862c62b000b8ead121a4455a8ddeff7248128d895692136f240d5d1614dc7cc4147b1bd584bd617e30560bb872064d09ea325", 'hex'),
//   Buffer.from("c6c205eb156ff6c862c62b000b8e55a8ddeff7248128d895692136f240d5d1614dc7cc4147b1bd584bd617e30560bb872064d09ea325", 'hex')
// )))

// Wasm = require('webassembly')
//     .load('')
//     .then(module => {
//         console.log("encoded = " + module.exports.encrypt_document(
//             Buffer.from("cac6c205eb06c8308d65156ff6c862c62b000b8ead121a4455a8ddeff7248128d895692136f240d5d1614dc7cc4147b1bd584bd617e30560bb872064d09ea325", 'hex'),
//             Buffer.from("c6c205eb156ff6c862c62b000b8e55a8ddeff7248128d895692136f240d5d1614dc7cc4147b1bd584bd617e30560bb872064d09ea325", 'hex')
//
//         ))
//     })
