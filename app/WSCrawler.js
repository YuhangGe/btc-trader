
const _util = require('./util');
const config = require('./config');
const logger = require('./logger');
const WebSocket = require('ws');
const pako = require('pako');
const moment = require('moment-timezone');
const TIME_FORMAT = 'YYYY/MM/DD HH:mm:ss.SSS';

const STATUS = {
  errorCount: 0,
  errorLastMessage: null,
  errorLastTime: null
};

module.exports = class WSCrawler {
  static get status() {
    return STATUS;
  }
  constructor(manager) {
    this.manager = manager;
    this._id = _util.aid();
    this._destried = false;
    this._ws = null;
    this._subMap = new Map();
    this._initialize();
  }
  _initialize() {
    if (this._destried) return;
    const ws = new WebSocket(`wss://${config.crawler.host}/ws`);
    ws.on('open', () => {
      if (this._destried) return;
      logger.info('crawler', this._id, 'websocket connected');
      config.symbols.forEach(sym => {
        const sub = `market.${sym}.kline.1min`;
        ws.send(JSON.stringify({
          sub: sub,
          id: `${sym}.${this._id}`
        }));
        this._subMap.set(sub, sym);
      });
    });
    ws.on('message', (data) => {
      if (this._destried) return;
      try {
        const text = pako.inflate(data, {
          to: 'string'
        });
        const msg = JSON.parse(text);
        if (msg.ping) {
          ws.send(JSON.stringify({
            pong: msg.ping
          }));
        } else if (msg.tick) {
          logger.debug('crawler', this._id, 'recieve tick', msg.ch, msg.ts, msg.tick.close);
          // manager.emit('tick', this._subMap.get(msg.ch), msg.ts, msg.tick.close);
          this.manager.put({
            symbol: this._subMap.get(msg.ch),
            timestamp: msg.ts,
            price: msg.tick.close
          });
        }
      } catch (ex) {
        this._onErr(ex);
      }
    });
    ws.on('close', () => {
      if (this._destried) return;
      logger.info('crawler', this._id, 'websocket closed, will restart');
      this.destroy();
      setImmediate(() => {
        this.manager.createWSCrawler();
      });
    });
    ws.on('error', err => {
      if (this._destried) return;
      logger.info('crawler', this._id, 'websocket error, will restart');
      this.destroy();
      this._onErr(err);
      setImmediate(() => {
        this.manager.createWSCrawler();
      });
    });
    this._ws = ws;
  }
  _onErr(err) {
    logger.error(err);
    STATUS.errorCount++;
    STATUS.errorLastTime = moment().tz('Asia/Shanghai').format(TIME_FORMAT);
    STATUS.errorLastMessage = err ? (err.message || err.toString()) : 'unkown';
  }
  destroy() {
    if (this._destried) return;
    this._destried = true;
    this.manager = null;
    if (this._ws) {
      try {
        this._ws.removeAllListeners();
        this._ws.terminate();
        this._ws = null;
      } catch (ex) {
        this._onErr(ex);
      }
    }
  }
};
