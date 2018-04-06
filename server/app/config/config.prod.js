const path = require('path');
module.exports = {
  log: {
    level: process.env['LOG_LEVEL'] || (process.env['SYNC_SCHEMA'] === 'true' ? 'debug' : 'info')
  },
  db: {
    synchronize: process.env['SYNC_SCHEMA'] === 'true',
    sqlite: {
      database: path.resolve(__root, '../run')
    }
  },
  router: {
    prefix: '__api'
  },
  static: {
    prefix: '__public',
    path: path.resolve(__root, '../../client')
  }
};
