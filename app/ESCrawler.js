const config = require('./config');
const logger = require('./logger');
const elastic = require('./elastic');

module.exports = class ESCrawler {
  constructor(manager) {
    this.manager = manager;
    this.step = {
      start: config.startTime.getTime(),
      end: config.startTime.getTime() + 60 * 1000
    };
    elastic.client.search({
      index: '',
      type: 'price',
      body: {
        query: {
          bool: {
            filter: [{
              terms: config.symbols
            }, {
              range: {
                timestamp: {

                }
              }
            }]
          }
        }
      }
    });
  }
};
