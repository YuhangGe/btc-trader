const path = require('path');
const pEnv = process.env;

module.exports = {
  app: {
    secretKey: null,
  },
  form: {
    maxBody: '50kb'
  },
  log: {
    level: 'debug',
    access: true
  },
  /* 系统初始化相关配置 */
  initialize: {
    /* 配置系统管理员账户信息 */
    admin: {
      username: 'admin',
      nickname: '管理员',
      theme: 'black'
    },
    /* 配置系统初始化时需要添加的用户 */
    users: [{
      username: 'xiaoge',
      nickname: '小葛',
      theme: 'black',
      roles: ['user']
    }]
  },
  static: {
    path: null
  },
  session: {
    // 优先从 env.SESSION_TYPE 中取，方便灵活调试
    type: pEnv['SESSION_TYPE'] || 'db', // 'db', 'redis'
    maxAge: 'session',     // 浏览器 session cookie 过期时间
    expire: 10 * 60 * 1000 // 服务器端 session 过期时间
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  db: {
    // 优先从 env.DB_TYPE 中取，方便灵活调试
    type: pEnv['DB_TYPE'] || 'sqlite', // 'mysql', 'sqlite'
    synchronize: pEnv['DB_SYNC'] !== 'false',
    sqlite: {
      database: path.resolve(__root, '../run')
    },   
    mysql: {
      host: '127.0.0.1',
      port: 3306,
      username: '',
      password: '',
      database: ''
    }
  },
  router: {
    prefix: '__api'
  },
  server: {
    root: pEnv['SERVER_ROOT'] || '/',  // 当配置为 nginx 反向代理时，需要修改 server.root
    port: pEnv['PORT'] || 8081,
    host: pEnv['HOST'] || '127.0.0.1'
  },
  huobi: {
    symbols: process.env['HUOBI_SYMBOLS'] || `
      btc,bch,eth,etc,ltc,eos,xrp,
      omg,dash,zec,ada,act,btm,bts,
      ont,iost,ht,trx,dta,neo,qtum,
      ela,ven,theta,snt,zil,xem,smt,
      nas,ruff,hsr,let,mds,storj,elf,itc,cvc,gnt`,
    concurrency: pEnv['HUOBI_CONCURRENCY'] ? parseInt(pEnv['HUOBI_CONCURRENCY']) : 10,
    apiHost: pEnv['HUOBI_API_HOST'] || 'api.huobipro.com',
    accountId: pEnv['HUOBI_ACCOUNT_ID'],
    accessKey: pEnv['HUOBI_ACCESS_KEY'],
    secretKey: pEnv['HUOBI_SECRET_KEY']
  },
  mailer: {
    maxTries: pEnv.MAIL_MAX_TRIES ? parseInt(pEnv.MAIL_MAX_TRIES) : 3,
    transportOptions: pEnv.MAIL_TRANSPORT_OPTIONS ? JSON.parse(pEnv.MAIL_TRANSPORT_OPTIONS) : {
      host: 'smtp.163.com',
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
