moneystream@moneystream-PC:~/parity-keys$


curl --data '{"method":"parity_accountsInfo","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":{"0x007567606d3ae13ee2c9c70b527d32c3ca680e9d":{"name":"moneystream"}},"id":1}

curl --data '{"method":"parity_signMessage","params":["0x007567606d3AE13ee2C9C70B527D32c3CA680e9d","kristina19092009","0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545



curl --data '{"method":"parity_accountsInfo","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545



// RUN parity with allowed access to default + [personal,parity_set,parity_accounts] module
sudo RUST_LOG=secretstore=trace,secretstore_net=trace ./parity --config config.toml --jsonrpc-apis web3,eth,pubsub,net,parity,parity_pubsub,parity_set,parity_accounts,traces,rpc,secretstore,personal

  , "aff8f7c542bf5f07348dbb3198d5e2cfa33fa49a0fbdb7d1796338c4da86fd79153902791a5acac91da6cc00d3d5ea9a06846f42d0a667fcead243a95b724f19@127.0.0.1:8082"


nodes = ["574d8433260ba25bea94b448938d55a4b7c801677d69f57ee5f70c51473529e074da2ef648826c18894486437ca7efd06e2b8990c8dc746a67da0f5eab0ad2d2@172.18.0.3:8085","aff8f7c542bf5f07348dbb3198d5e2cfa33fa49a0fbdb7d1796338c4da86fd79153902791a5acac91da6cc00d3d5ea9a06846f42d0a667fcead243a95b724f19@172.18.0.4:8087"]


////////////////////////////////////////////////////////////////////////////////////////
//   NODES SETUP (NETWORKING)
////////////////////////////////////////////////////////////////////////////////////////
ss:
  private fecc29489943b52ff71f2df55318972137b8726938a14ea03d872d009dc9261b
  public 77fe0d128baf391e51acfa8fea775f6d12285d6031d82bbe79cda239e3c93df5d05d9dd27bf902be9bb00578fa1d365cf2ca5989f7931d38943309c78a64f863

ss2:
  private d23fec4d41e0fa1dc77da2fec25e567366374d2127bb582d3d697652320901e5
  public 574d8433260ba25bea94b448938d55a4b7c801677d69f57ee5f70c51473529e074da2ef648826c18894486437ca7efd06e2b8990c8dc746a67da0f5eab0ad2d2

ss3:
  private d63072991f08d823240f86442c03e90f35e246989e9ec5eb8ecb342eaa39ac03
  public aff8f7c542bf5f07348dbb3198d5e2cfa33fa49a0fbdb7d1796338c4da86fd79153902791a5acac91da6cc00d3d5ea9a06846f42d0a667fcead243a95b724f19


// ID# description
//  1) get accounts_list from node,
//  2) unlock account #1 for allow signing,
//  3) calculate document hash as identifier
//  4) eth_sign this identifier

curl --data '{"method":"personal_listAccounts","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d"],"id":1}

curl --data '{"method":"personal_unlockAccount","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d","kristina19092009",null],"id":2,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":true,"id":2}
// "result":true   mean that account allowed for signing == so must check result flag

curl --data '{"method":"personal_unlockAccount","params":["0x00a329c0648769a73afac7f9381e08fb43dbea72","",null],"id":2,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545

// it would be good to use document contents hash as this identifier, so params: [
//   "0x68656c6c6f20776f726c64" // "hello world"
// ]
curl --data '{"method":"web3_sha3","params":["0x68656c6c6f20776f726c64"],"id":3,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad","id":3}

curl --data '{"method":"eth_sign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d", "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"],"id":4,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0xab32f23fa2ceecfb491b61706bd6855b53e0b38aca0e8bc3b910279d1a9e90ec1d4fc8a5efdda4aecf44a474f4fc928f0471106ec64ffe0f1069a64bacd0390a1b","id":4}



curl --data '{"method":"parity_setEngineSigner","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d","kristina19092009"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":true,"id":1}

curl --data '{"method":"parity_postSign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d","0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x1","id":1}

curl --data '{"method":"parity_unsignedTransactionsCount","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":0,"id":1}

curl --data '{"method":"parity_checkRequest","params":["0x1"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0xab32f23fa2ceecfb491b61706bd6855b53e0b38aca0e8bc3b910279d1a9e90ec1d4fc8a5efdda4aecf44a474f4fc928f0471106ec64ffe0f1069a64bacd0390a1b","id":1}

curl -v -X POST http://localhost:8082/shadow/47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad/ab32f23fa2ceecfb491b61706bd6855b53e0b38aca0e8bc3b910279d1a9e90ec1d4fc8a5efdda4aecf44a474f4fc928f0471106ec64ffe0f1069a64bacd0390a1b/1



curl --data '{"method":"web3_sha3","params":["0x0000000000000000000000000000000000000000000000000000000000000000"],"id":3,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563","id":3}


curl --data '{"method":"eth_sign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d", "0x0000000000000000000000000000000000000000000000000000000000000000"],"id":4,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0xabc11f18fe338b089134042361adf2b16bf4f47fe772b81838574a932a7e1aa34c6174e85dab033ca7977ba93c97e3cd0e3d5ef14f125938f09de77124a57ad61b","id":4}

curl -v -X POST http://localhost:8082/shadow/0000000000000000000000000000000000000000000000000000000000000000/abc11f18fe338b089134042361adf2b16bf4f47fe772b81838574a932a7e1aa34c6174e85dab033ca7977ba93c97e3cd0e3d5ef14f125938f09de77124a57ad61b/1


LAST


curl --data '{"method":"eth_sign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d", "0x20202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020"],"id":4,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0xe3d1e67aa074156915d8d461eb4d64e8a47804d981c133cd1615d7b2b9695feb6d0698a7b63187f7e6a962073d60884a6a2d92c7be51f272f58e999c12240c1c1b","id":4}


curl -v -X POST http://localhost:8082/shadow/0000000000000000000000000000000000000000000000000000000000000000/e3d1e67aa074156915d8d461eb4d64e8a47804d981c133cd1615d7b2b9695feb6d0698a7b63187f7e6a962073d60884a6a2d92c7be51f272f58e999c12240c1c1b/1



//   "0x68656c6c6f20776f726c64" // "hello world"
curl --data '{"method":"web3_sha3","params":["0x68656c6c6f20776f726c64"],"id":3,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad","id":3}

curl --data '{"method":"eth_sign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d", "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"],"id":4,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0xab32f23fa2ceecfb491b61706bd6855b53e0b38aca0e8bc3b910279d1a9e90ec1d4fc8a5efdda4aecf44a474f4fc928f0471106ec64ffe0f1069a64bacd0390a1b","id":4}

curl -v -X POST http://localhost:8082/shadow/47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad/ab32f23fa2ceecfb491b61706bd6855b53e0b38aca0e8bc3b910279d1a9e90ec1d4fc8a5efdda4aecf44a474f4fc928f0471106ec64ffe0f1069a64bacd0390a1b/1




//   "0x68656c6c6f20776f726c64" // "hello world"
curl --data '{"method":"web3_sha3","params":["0x68656c6c6f20776f726c64"],"id":3,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad","id":3}


curl --data '{"method":"web3_sha3","params":["0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"],"id":3,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x04cd40a3ea7972c6f30142d02fd5ddcac438fe6c59e634cecb827fbee9d385fc","id":3}


curl --data '{"method":"eth_sign","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d", "0x04cd40a3ea7972c6f30142d02fd5ddcac438fe6c59e634cecb827fbee9d385fc"],"id":4,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":"0x6024fb0e8489263651953deb701503a84e90f05b4f48beb9b230a8b0828ff3c049d2b09db1dc49fb7f6e2a70c252f8b037103ae3edf3909a4dd89c76b0e9d61f1c","id":4}


curl -v -X POST http://localhost:8082/shadow/47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad/6024fb0e8489263651953deb701503a84e90f05b4f48beb9b230a8b0828ff3c049d2b09db1dc49fb7f6e2a70c252f8b037103ae3edf3909a4dd89c76b0e9d61f1c/1



  curl --data '{"method":"parity_newAccountFromSecret","params":["1b84ec0aa87546aab20950f640d80899d95f6bb55b2cd684d9015a1e9a1c6ac6","hunter2"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545



curl -v -X POST http://localhost:8082/0000000000000000000000000000000000000000000000000000000000000009/22fd7ead06ffe4e4158ebd8fdf2e045281e1aec03f82654163300fca8e6d92a361224e67488be93836fbaade320ac8c7bea740f51096da4f87eb2868eab7960001/0


curl -v -X POST http://localhost:8082/47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad/4e6b8ea0bfcb0dcecc7332379681b11ab1c91c36cce18dad8c291d36a2b74f980d27998b3d867d69fb69d60b5f203c9215c17656d791d0c2ec059f3bb817465f00/0



////////////////////////////////////////////////////////////////////////////////////////
//   working with RANDOM key
////////////////////////////////////////////////////////////////////////////////////////

./target/release/ethkey generate random
secret:  c779b3b500ee004f76ef35c0de164fb3ee95b320b6f5ca54506a3df6ce392bb2
public:  6cdb148d48f39c146418b153dd7ac4802d522fda92b6630792fb060c95e4795a151d882462f429508a992684a0208d1515529da3b33ccca111e3573af3be5ebe
address: f8c0cced2ebaed8de082f525e3a6e457ddd6ecb2


////////////////////////////////////////////////////////////////////////////////////////
//   ETH - SIGN  SOME  STUFF
////////////////////////////////////////////////////////////////////////////////////////

curl --data '{"method":"personal_unlockAccount","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d","kristina19092009",null],"id":2,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":true,"id":2}

curl --data '{"method":"parity_exportAccount","params":["0x007567606d3ae13ee2c9c70b527d32c3ca680e9d","kristina19092009"],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545
{"jsonrpc":"2.0","result":{"address":"007567606d3ae13ee2c9c70b527d32c3ca680e9d","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"7d71a8d78c94adcb790a44bc148a3a38"},"ciphertext":"f1b005ecd56f0db5c5691cbf8fbc624a71a91d9877e3a80cfdb18f0177ffd18a","kdf":"pbkdf2","kdfparams":{"c":10240,"dklen":32,"prf":"hmac-sha256","salt":"6376c10d2802b4cd3ba231b75dadf317c084e7e691468dc8d5df4d2611bd643f"},"mac":"7febc04c0e8edb6bc4e1363081af71ba29c1e4b842afea5401e2878b7763e647"},"id":"28643d13-4360-59fa-c6b8-f5b7a8935d1c","meta":"{\"description\":\"\",\"passwordHint\":\"as usual\",\"timestamp\":1515796466445}","name":"moneystream","version":3},"id":1}



curl http://localhost:8082/1785a1b68217dc92f16b3186af64825308b89225fb68eef65c9966131c9e6d24/f67a09c614e090f575931f67f141a2ed6e3ffa73f32129ff69beba20b42c7210111970b728cbfcf38fe0d8d0471c7d1641a36afbc5ee5d6942c2627c90ecf5dc



  [
"0x00a329c0648769A73afAc7F9381E08FB43dBEA7",
"",
"0x4fd04eed9c53fdb5497cb66edeb7670b604cfdc1e27dae02d464a197596c180674405c049a5e38191f5d2b7da38eabdf924b4dd6363eb4afba1724a87be102e5",
"0x1aabb612d187318cd605e08854ec498dfd7f8bb1cda7da1a9ba6be70c5479b143ff404328e7af863bbda62050d681058b29605aa0fe40db8f74a671cb04599b3", ["0x04487ea5bd83b1ac313d9a3fa453c4e1eaf5a4518a0ef0e16745a53219d8b1789099f0507a56ffc0ce92938519939fadd738ccad0ad04cba0afe4749c20df6e9c9f15c1c62e74a81c1152cee7754734e70936f1af9ace0a52682f2ec96ee32b2bf412ec833d611e5c4fd07aaefe1bfd0bc8efd6daf625248aef11aad44fbe3e81a8ce1b473ca1efa4187f3332ef7759e23"],
"0x66afd18cfdabb689605f9ecbe9d3d6764ffe2efb0b629de1b3303e880bf4ca7ef0c03a24b629027166a8"]


curl --data-binary '{"jsonrpc": "2.0", "method": "secretstore_shadowDecrypt", "params": ["0x00a329c0648769a73afac7f9381e08fb43dbea7", "", "0x7b9613f53dde1a84b159fb0fb1ee13e6b4bb8f35e46a2aba8ad174d86a671f9451cbd0b9cae8ac931100033ef1ff3a3b67a3688553c579dfb95b9e9efdab86f8", "0x1aabb612d187318cd605e08854ec498dfd7f8bb1cda7da1a9ba6be70c5479b143ff404328e7af863bbda62050d681058b29605aa0fe40db8f74a671cb04599b3", ["0x047151b18ea8c4043ed6771c8625b8606ab16c64abeef35a015d7c5c51a56a48dbcfa85c478eab876215c798e22fb165842f9dfc8130d31a5f27f2588b98b84dc4dea565648d1ebc57b7731f8f61c4d726d425103b927e3f7dd9bb2909123dd42f904fb34c6fa3372d5491732db43e3024d91dd03974ae6d247b36bdc3c3390bbadefbb4c77118844636c6dc650efef845"], "0x66afd18cfdabb689605f9ecbe9d3d6764ffe2efb0b629de1b3303e880bf4ca7ef0c03a24b629027166a8"], "id":"777" }' -H 'Content-type: application/json;' http://127.0.0.1:8545/