const chalk = require('chalk')
const { DPT } = require('../src')
const Buffer = require('safe-buffer').Buffer
const ms = require('ms')
const fs = require('fs')

class MyDPT extends DPT{
  constructor(privateKey, options){
    super(privateKey, options)
    //Живые узлы
    this._result = []
    //Буфферный массив соседей
    this._neighbours = []
    //Количество потоков
    this._threads = 10
    //Файл для записи результата
    this._writeStream = fs.createWriteStream('./output.txt',{
      flags: 'a',
      encoding: 'utf8',
      mode: 0o666,
      autoClose: true
    })
  }
//При получении пакета neighbours от узла:
  _onServerPeers (peers) {
    for (let peer of peers){
      //Проверить, находиться ли узел в массиве. Добавить, если нет.
      if(this._neighbours.map(el => el.address).indexOf(peer.address) == -1)
        this._neighbours.push({
            address : peer.address,
            udpPort : peer.udpPort,
            tcpPort : peer.tcpPort
          })
      }
  }
//Пинг узла, добавление его в массив живых узлов.
  async addPeer (obj) {
    if (this._banlist.has(obj)) throw new Error('Peer is banned')
  //   check k-bucket first
    const peer = this._kbucket.get(obj)
    if (peer !== null) return peer


    // check that peer is alive
    try {
      const peer = await this._server.ping(obj)
      this.emit('peer:new', peer)
      this._kbucket.add(peer)
      //Проверить, есть ли узел в массиве
      if(this._result.map(el => el.address).indexOf(obj.address) == -1){
        this._result.push(obj)
        this._writeStream.write(obj.address+":"+obj.udpPort+":"+obj.tcpPort+"\n")
      }
      return peer
    } catch (err) {
      this._banlist.add(obj, ms('5m'))
      throw err
    }
  }
//Попробовать пинг к N = this._threads узлам из массива this._neighbours.
//Послать им findneighbours пакет. Удалить их из массива this._neighbours.
//Закрыть функцию на рекурсию. Остановить, когда не останется узлов в this._neighbours.
  crawling(){
    if(this._neighbours.length==0) return;
    console.log(`Neighbours:${this._neighbours.length}; Live nodes:${this._result.length}`)
    let promises = []
    for(var i = 0; i < (this._neighbours.length < this._threads ? this._neighbours.length : this._threads); i++)
      promises.push(this.addPeer(this._neighbours[i]).catch((e)=>{}))
    Promise.all(promises)
      .then((results) => {
        return new Promise(resolve =>{
          for(let j = 0; j < i; j++){
            this._server.findneighbours(this._neighbours[0], this._id)
            this._neighbours.shift()
          }
          resolve()
       })
     })
     .then(() => {
       setTimeout(()=>{this.crawling()},1000);
     })
    // .catch((err) => {console.log("xxx")})
  }
//Задает 1 узел, кол-во потоков и запускает crawler
  start(bootnode, threads){
    this._neighbours.push(bootnode)
    if(threads)
      this._threads = threads
    console.log(`Crawling started with bootstap node ${bootnode.address}:${bootnode.udpPort}; Threads: ${this._threads}.`)
    this.crawling()
  }

  //Переопределение функций, которые мешают нормальной работе:
  refresh(){}
  _onKBucketPing (oldPeers, newPeer) {}
}

const PRIVATE_KEY = 'd772e3d6a001a38064dd23964dd2836239fa0e6cec8b28972a87460a17210fe9'
// Создание объекта класса с timeout равной 1 секунде, чтобы быстрее отсекать неживые ноды
const dpt = new MyDPT(Buffer.from(PRIVATE_KEY, 'hex'), {
  timeout : ms('1s'),
  endpoint: {
    address: '0.0.0.0',
    udpPort: null,
    tcpPort: null
  }
})
//bootstrap нода тестовой сети
const TEST_BOOTNODE = {
  address : "52.169.42.101",
  udpPort: "30303",
  tcpPort: "30303"
}
//bootstrap нода основной сети
const BOOTNODE = {
  address: "13.75.154.138",
  udpPort: "30303",
  tcpPort: "30303"
}

dpt.start(TEST_BOOTNODE)
