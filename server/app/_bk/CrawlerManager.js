const config = require('./config');
const logger = require('./logger');
const WSCrawler = require('./WSCrawler');

class CrawlerManager {
  constructor() {
    this._buf = [];
    this._eat = {
      promise: null,
      resolve: null,
      reject: null
    };
    this._ws = {
      crawler: null,
      interval: null,
      lastTS: Date.now()
    };
  }
  put(...ticks) {
    this._buf.push(...ticks);
    this._eat.lastTS = ticks[ticks.length - 1].timestamp;
    if (this._eat.promise) {
      const resolve = this._eat.resolve;
      this._eat.promise = this._eat.resolve = null;
      resolve(this._buf.shift());      
    }
  }
  async eat() {
    if (this._eat.promise) {
      return this._eat.promise;
    }
    if (this._buf.length > 0) {
      return this._buf.shift();
    }
    this._eat.promise = new Promise((res) => {
      this._eat.resolve = res;
    });
    if (!this._ws.crawler) {
      this.createWSCrawler();
    }
    return this._eat.promise;
  }
  createWSCrawler() {
    if (this._ws.crawler) this._ws.crawler.destroy();
    this._ws.crawler = new WSCrawler(this);
    if (this._ws.interval) return;
    this._ws.interval = setInterval(() => {
      const now = Date.now();
      if (!this._ws.crawler._ws) {
        this._ws.lastTS = now;
        // not ready
        return;
      }
      // logger.debug(config.api.resetInterval, now - st.receiveLastTickTimestamp);
      if (now - this._ws.lastTS >= config.crawler.resetInterval) {
        logger.info('crawler', this._ws.crawler._id, 'will restart because of long time no tick', config.api.resetInterval, now - this._ws.lastTS);
        this.createWSCrawler();
      }
    });
  }
}

// singleton
module.exports = new CrawlerManager();
