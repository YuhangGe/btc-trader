const logger = require('./logger');
const crawler = require('./CrawlerManager');

(async function () {
  for(;;) {
    console.log('eat');
    const tick = await crawler.eat();
    console.log('got!');
    logger.debug(tick);
  }
})().catch(err => {
  logger.error(err);
  process.exit(-1);
});

