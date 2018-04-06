let client = null; // singleton
async function getElasticsearchClient(app, config) {
  if (client) return client;
  const elasticsearch = require('elasticsearch');
  
  client = new elasticsearch.Client({
    hosts: config.hosts,
    apiVersion: config.apiVersion,
    log: {
      level: process.env['LOG_ES_TRACE'] ? 'trace' : (app.config.log.level === 'warn' ? 'warning' : app.config.log.level)
    }
  });
  // test connection
  await client.ping();
  app.logger.info('elasticsearch connected.');
  return client;
}

module.exports = {
  getElasticsearchClient
};
