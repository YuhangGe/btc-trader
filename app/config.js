const _util = require('./util');
const pEnv = process.env;
const logLevel = pEnv.LOG_LEVEL || (pEnv.NODE_ENV === 'production' ? 'info' : 'debug');
const esHosts = pEnv.ES_HOSTS || '172.16.150.29:9200';
const resetInterval = Number(pEnv.RESET_INTERVAL || 30 * 1000);

const symbols = (
  pEnv['SYMBOLS']
  || 'btcusdt,ethusdt'
).split(/\s*,\s*/);

const config = {
  symbols,
  startTime: _util.parseTime(pEnv.START_TIME || Date.now()),
  endTime: pEnv.END_TIME ? _util.parseTime(pEnv.END_TIME) : null,
  server: {
    host: '0.0.0.0',
    port: 8066
  },
  logger: {
    level: logLevel
  },
  crawler: {
    resetInterval,
    host: 'api.huobipro.com',
  },
  elastic: {
    indexPrefix: pEnv.INDEX_PREFIX || 'huobi',
    hosts: esHosts.split(','),
    apiVersion: '6'
  },
  mailer: {
    transportOptions: pEnv.MAIL_TRANSPORT_OPTIONS ? JSON.parse(pEnv.MAIL_TRANSPORT_OPTIONS) : {
      host: 'smtp.qq.com',
      secureConnection: true,
      port: 465,
      secure: true,
      auth: {
        user: pEnv.MAIL_USER,
        pass: pEnv.MAIL_PASS
      }
    },
    sendOptions: pEnv.MAIL_SEND_OPTIONS ? JSON.parse(pEnv.MAIL_SEND_OPTIONS) : {
      from: `"${pEnv.MAIL_FROM || 'Crawler'}" <${pEnv.MAIL_USER}>`,
      to: pEnv.MAIL_TO
    }
  }
};

module.exports = config;