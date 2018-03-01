# SmartMiraStore

[![NPM Package](https://img.shields.io/npm/v/ethereumjs-devp2p.svg?style=flat-square)](https://www.npmjs.org/package/ethereumjs-devp2p)
[![Build Status](https://travis-ci.org/ethereumjs/ethereumjs-devp2p.svg?branch=master)](https://travis-ci.org/ethereumjs/ethereumjs-devp2p)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


# Использование Permissioning smart-contract для ограничения доступа к Secret Store
[sandbox/ss-acl-permission](https://github.com/mira-lab/SmartMiraStore/ss-acl-permission.js) 
Для упрощения понимания функционирования решения прилагается набор тестов Permissioning 
(в каждом подпункте описания архитектуры в конце указываю строку запуска соотвествующего теста).

При этом результаты сохраняются в файлы на диск, поэтому след.тест можно вызывать сразу, 
параметры подгрузятся полностью автоматически (можно не указывать в параметрах вызова)

Смарт-контракт и его ABI используемые в решении:
- [permissionning contract](https://github.com/mira-lab/SmartMiraStore/contracts/permission.sol) for Secret Store
- [contract ABI](https://github.com/mira-lab/SmartMiraStore/contracts/permissioning.json)

Решение использует:
ранее написанную библиотеку [lib/paritySecretStore](https://github.com/mira-lab/SmartMiraStore/lib/paritySecretStore/index.js),
операции с blockchain Etherium [web3](https://github.com/ethereum/web3.js),
и другие node_modules & sub-libraries.

## Тестовое решение для [SecretStore от Parity](https://github.com/svyatonik/sstore_test)
Поскольку проект чисто "девелоперский", и readme.md отсутствует, то привожу краткую инструкцию для зауска.

1) Собрать исполняемый файл parity под Вашу систему (см. ниже). 
После сборки копируете исполняемый файл командой из консоли cp ~/parity/target/release/parity ~/sstore_test в корень тестового проекта.

2) Запустить все три ноды на локальной машине скриптом из корня проекта ./start.sh
Остановка выполняется скриптом ./stop.sh который просто убивает все процессы по шаблону parity*

3) Зайти в [веб-интерфейс Parity](http://127.0.0.1:8180/) выбрать второй справа пункт меню Contracts и внести код контракта
[permissionning contract](https://github.com/mira-lab/SmartMiraStore/contracts/permission.sol) 
Скомпилировать и задеплоть кнопками справа. В результате деплоя получается ETH-адрес, байт код и ABI контракта.

4) Перейти на домашнюю страницу клиента (слева вверху иконка домика). 
Настроить адрес ACL контракта в системе при помощи DApps-приложения "Registry". Для этого сначала резервируется имя secretstore_acl_checker ,
затем регистрируете под этим именем адрес полученный в п.2 

5) Отредактировать все 3 файла конфигурации dev_ss{1,2,3}.toml, добавив строки
disable_acl_check = false
service_contract = "registry"
   
Таким образом права на доступ к SecretStore начинают управляться ACL smart-contract (реально работает только в сборках Parity начиная с 1.10), а для его lookup будет использоваться
Contract Name Registry (обычное предустановленное DApps-приложение начиная с Parity 1.4)

6) Перезапускаете проект (./stop.sh + ./start.sh)


## Сборка исполняемого файла парити под Вашу систему
Краткая [инструкция](https://wiki.parity.io/Setup#building-from-source) по сборке 

1) Устанавливаем rust или обновляем до самой свежей версии (обновление - это деинсталлировать все и поставить по новой - см.описание RUST)
curl https://sh.rustup.rs -sSf | sh

2) After this, you can use the rustup command to also install beta or nightly channels for Rust and Cargo.
Запустите менеджер установки rustup, выберите пункт 2 для настройки дополнительных каналов обновления (beta or nightly) и корректного выбора target platform.
Затем подтвердите выбор и выполните установку по пункту 1.

3) Склонируйте [репозиторий](https://github.com/paritytech/parity/tree/beta) непосредственно от Parity.
Я выбираю всегда ветку beta, хотя на момент написания этого readme как раз обновился stable.

4) После стабильной v.1.9.3 все следующие версии Parity client не позволяют компилировать и деплоить контракт, пишут про невозможность исполнения inline-js scripts и политику безопасности.
Я добавил локально генерацию cross-origin заголовка прямо в код, игры с manifest.json и т.д. не помогли.
  dapps/src/handlers/mod.rs: 78
  let eval = " 'unsafe-eval'";
Т.е. заголовок добавляем всегда, а не как было изначально зависимо от флага allow_js_eval, который непонятно где устанавливается.

5) Запускаем сборку кода, обязательно с включенной опцией --secretstore
  cargo build --features secretstore --release
  
  
## Публичные методы доступные в смарт-контракте

function addKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {}

function rmKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {}

function checkKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {}

function whoAccess(bytes32 document) public returns (address) {}
    
function permittedCount(bytes32 document) public returns (uint256) {}
    
function checkPermissions(address user, bytes32 document) public constant returns (bool) {}


## Описание технического background и архитектуры решения

1) Система работает на базе кошелька Copay, функционирует в сети BTC. 
Имеем Copay HD (master private key), для каждого МираБокса с помощью библиотеки создается derived_private_key.

2) Создаем Parity account от такого же private key, получаем публичный ключ и хеш от него соотвественно адрес в сети ETH.
[node ss-acl-permission.js g] - сохраняет приватный ключ first.privkey и адрес first.eth 

3) Делаем запрос к локальной ноде Secret store для шифрования файла (encode), подписанный key А.
В результате получаем documentId, encrypted document. 
Задаем пин, даем права account_address_A (user A) на доступ 
Проверяем что user A имеет доступ к SecretStore по данному documentId, а любой другой пользователь (например user B) нет.


## Run/Build

This library has to be compiled with babel to a ``Node 6`` friendly source format.
For triggering a (first) build to create the ``lib/`` directory run:

```
npm run build
```

You can also use babel just-in-time compilation to run a script:

```
node -r babel-register [YOUR_SCRIPT_TO_RUN.js]
```

## Usage/Examples

All components of this library are implemented as Node ``EventEmitter`` objects
and make heavy use of the Node.js network stack.

You can react on events from the network like this:

```
dpt.on('peer:added', (peer) => {
  // Do something...
})
```

Basic example to connect to some bootstrap nodes and get basic peer info:

  - [simple](examples/simple.js)

Communicate with peers to read new transaction and block information:

  - [peer-communication](examples/peer-communication.js)

Run an example with:

```
node -r babel-register ./examples/peer-communication.js
```

## Distributed Peer Table (DPT) / Node Discovery

Maintain/manage a list of peers, see [./src/dpt/](./src/dpt/), also 
includes node discovery ([./src/dpt/server.js](./src/dpt/server.js))

### Usage

Create your peer table:

```
const dpt = new DPT(Buffer.from(PRIVATE_KEY, 'hex'), {
  endpoint: {
    address: '0.0.0.0',
    udpPort: null,
    tcpPort: null
  }
})
```

Add some bootstrap nodes (or some custom nodes with ``dpt.addPeer()``):

```
dpt.bootstrap(bootnode).catch((err) => console.error('Something went wrong!'))
```

### API


#### `DPT` (extends `EventEmitter`)
Distributed Peer Table. Manages a Kademlia DHT K-bucket (``Kbucket``) for storing peer information 
and a ``BanList`` for keeping a list of bad peers. ``Server`` implements the node discovery (``ping``,
``pong``, ``findNeighbours``).

##### `new DPT(privateKey, options)`
Creates new DPT object
- `privateKey` - Key for message encoding/signing.
- `options.refreshInterval` - Interval in ms for refreshing (calling ``findNeighbours``) the peer list (default: ``60s``).
- `options.createSocket` - A datagram (dgram) ``createSocket`` function, passed to ``Server`` (default: ``dgram.createSocket.bind(null, 'udp4')``).
- `options.timeout` - Timeout in ms for server ``ping``, passed to ``Server`` (default: ``10s``).
- `options.endpoint` - Endpoint information to send with the server ``ping``, passed to ``Server`` (default: ``{ address: '0.0.0.0', udpPort: null, tcpPort: null }``).

#### `dpt.bootstrap(peer)` (``async``)
Uses a peer as new bootstrap peer and calls ``findNeighbouts``.
- `peer` - Peer to be added, format ``{ address: [ADDRESS], udpPort: [UDPPORT], tcpPort: [TCPPORT] }``.

#### `dpt.addPeer(object)` (``async``)
Adds a new peer.
- `object` - Peer to be added, format ``{ address: [ADDRESS], udpPort: [UDPPORT], tcpPort: [TCPPORT] }``.

For other utility functions like ``getPeer``, ``getPeers`` see [./src/dpt/index.js](./src/dpt/index.js).

### Events

Events emitted:

| Event         | Description                              |
| ------------- |:----------------------------------------:|
| peer:added    | Peer added to DHT bucket                 |
| peer:removed  | Peer removed from DHT bucket             |
| peer:new      | New peer added                           |
| listening     | Forwarded from server                    |
| close         | Forwarded from server                    |
| error         | Forwarded from server                    |

### Reference

- [Node discovery protocol](https://github.com/ethereum/wiki/wiki/Node-discovery-protocol)
- [RLPx - Node Discovery Protocol](https://github.com/ethereum/devp2p/blob/master/rlpx.md#node-discovery)
- [Kademlia Peer Selection](https://github.com/ethereum/wiki/wiki/Kademlia-Peer-Selection)

## RLPx Transport Protocol

Connect to a peer, organize the communication, see [./src/rlpx/](./src/rlpx/)

### Usage

Create your ``RLPx`` object, e.g.:

```
const rlpx = new devp2p.RLPx(PRIVATE_KEY, {
  dpt: dpt,
  maxPeers: 25,
  capabilities: [
    devp2p.ETH.eth63,
    devp2p.ETH.eth62
  ],
  listenPort: null
})
```

### API

#### `RLPx` (extends `EventEmitter`)
Manages the handshake (`ECIES`) and the handling of the peer communication (``Peer``).

##### `new RLPx(privateKey, options)`
Creates new RLPx object
- `privateKey` - Key for message encoding/signing.
- `options.timeout` - Peer `ping` timeout in ms (default: ``10s``).
- `options.maxPeers` - Max number of peer connections (default: ``10``).
- `options.clientId` - Client ID string (default example: ``ethereumjs-devp2p/v2.1.3/darwin-x64/nodejs``).
- `options.remoteClientIdFilter` - Optional list of client ID filter strings (e.g. `['go1.5', 'quorum']`).
- `options.capabilities` - Upper layer protocol capabilities, e.g. `[devp2p.ETH.eth63, devp2p.ETH.eth62]`.
- `options.listenPort` - The listening port for the server or ``null`` for default.
- `options.dpt` - `DPT` object for the peers to connect to (default: ``null``, no `DPT` peer management).

#### `rlpx.connect(peer)` (``async``)
Manually connect to peer without `DPT`.
- `peer` - Peer to connect to, format ``{ id: PEER_ID, address: PEER_ADDRESS, port: PEER_PORT }``.

For other connection/utility functions like ``listen``, ``getPeers`` see [./src/rlpx/index.js](./src/rlpx/index.js).

### Events

Events emitted:

| Event         | Description                              |
| ------------- |:----------------------------------------:|
| peer:added    | Handshake with peer successful           |
| peer:removed  | Disconnected from peer                   |
| peer:error    | Error connecting to peer                 |
| listening     | Forwarded from server                    |
| close         | Forwarded from server                    |
| error         | Forwarded from server                    |


### Reference

- [RLPx: Cryptographic Network & Transport Protocol](https://github.com/ethereum/devp2p/blob/master/rlpx.md)
- [devp2p wire protocol](https://github.com/ethereum/wiki/wiki/%C3%90%CE%9EVp2p-Wire-Protocol)

## Ethereum Wire Protocol (ETH)

Upper layer protocol for exchanging Ethereum network data like block headers or transactions with a node, see [./src/eth/](./src/eth/)

### Usage

Send the initial status message with ``sendStatus()``, then wait for the corresponding `status` message
to arrive to start the communication.

```
eth.once('status', () => {
  // Send an initial message
  eth.sendMessage()
})
```

Wait for follow-up messages to arrive, send your responses. 

```
eth.on('message', async (code, payload) => {
  if (code === devp2p.ETH.MESSAGE_CODES.NEW_BLOCK_HASHES) {
    // Do something with your new block hashes :-)
  }
})
```

See the ``peer-communication.js`` example for a more detailed use case.

### API

#### `ETH` (extends `EventEmitter`)
Handles the different message types like `NEW_BLOCK_HASHES` or `GET_NODE_DATA` (see `MESSAGE_CODES`) for
a complete list. Currently protocol versions `PV62` and `PV63` are supported.

##### `new ETH(privateKey, options)`
Normally not instantiated directly but created as a ``SubProtocol`` in the ``Peer`` object.
- `version` - The protocol version for communicating, e.g. `63`.
- `peer` - `Peer` object to communicate with.
- `send` - Wrapped ``peer.sendMessage()`` function where the communication is routed to.

#### `eth.sendStatus(status)`
Send initial status message.
- `status` - Status message to send, format ``{ networkId: CHAIN_ID, td: TOTAL_DIFFICULTY_BUFFER, bestHash: BEST_HASH_BUFFER, genesisHash: GENESIS_HASH_BUFFER }``.

#### `eth.sendMessage(code, payload)`
Send initial status message.
- `code` - The message code, see `MESSAGE_CODES` for available message types.
- `payload` - Payload as a list, will be rlp-encoded.

### Events

Events emitted:

| Event         | Description                              |
| ------------- |:----------------------------------------:|
| message       | Message received                         |
| status        | Status info received                     |

### Reference

- [Ethereum wire protocol](https://github.com/ethereum/wiki/wiki/Ethereum-Wire-Protocol)


## Tests

There are unit tests in the ``test/`` directory which can be run with:

```
npm run test
```

## Debugging

This library uses [debug](https://github.com/visionmedia/debug) debugging utility package.

For the debugging output to show up, set the ``DEBUG`` environment variable (e.g. in Linux/Mac OS: 
``export DEBUG=*,-babel``).

You should now see debug output like to following when running one of the examples above (the indented lines):

```
Add peer: 52.3.158.184:30303 Geth/v1.7.3-unstable-479aa61f/linux-amd64/go1.9 (eth63) (total: 2)
  devp2p:rlpx:peer Received body 52.169.42.101:30303 01c110 +133ms
  devp2p:rlpx:peer Message code: 1 - 0 = 1 +0ms
  devp2p:rlpx refill connections.. queue size: 0, open slots: 20 +1ms
  devp2p:rlpx 52.169.42.101:30303 disconnect, reason: 16 +1ms
Remove peer: 52.169.42.101:30303 (peer disconnect, reason code: 16) (total: 1)
```

## General References

### Other Implementations

The following is a list of major implementations of the ``devp2p`` stack in other languages:

- [pydevp2p](https://github.com/ethereum/pydevp2p) (Python)
- [Go Ethereum](https://github.com/ethereum/go-ethereum/tree/master/p2p) (Go)
- [Exthereum](https://github.com/exthereum/exth_crypto) (Elixir)

### Links

- [Blog article series](https://ocalog.com/post/10/)  on implementing Ethereum protocol stack

## License

MIT
