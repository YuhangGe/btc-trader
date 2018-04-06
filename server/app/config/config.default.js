const path = require('path');

module.exports = {
  app: {
    secretKey: null,
  },
  form: {
    maxBody: '50kb'
  },
  log: {
    path: path.resolve(__root, '../run/logs'),
    level: 'debug',
    access: true
  },
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
  }],
  static: {
    path: null
  },
  session: {
    // 优先从 env.SESSION_TYPE 中取，方便灵活调试
    type: process.env['SESSION_TYPE'] || 'db', // 'db', 'redis'
    maxAge: 'session',     // 浏览器 session cookie 过期时间
    expire: 10 * 60 * 1000 // 服务器端 session 过期时间
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  db: {
    // 优先从 env.DB_TYPE 中取，方便灵活调试
    type: process.env['DB_TYPE'] || 'sqlite', // 'mysql', 'sqlite'
    synchronize: process.env['DB_SYNC'] !== 'false',
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
    mode: process.env['SERVER_MODE'] || 'standalone', // 'enterprise' 代表和企业版整合模式。https://github.com/HanSight-Dev/ueba-web/wiki/%E4%BC%81%E4%B8%9A%E7%89%88%E4%BC%9A%E8%AF%9D%E6%95%B4%E5%90%88%E5%92%8C%E6%9D%83%E9%99%90%E7%AE%A1%E7%90%86%E6%96%B9%E6%A1%88
    root: process.env['SERVER_ROOT'] || '/',  // 当配置为 nginx 反向代理时，需要修改 server.root
    port: process.env['PORT'] || 80,
    host: process.env['HOST'] || '127.0.0.1'
  },
  elastic: {
    enable: false,
    hosts: [ '127.0.0.1:9200' ],
    apiVersion: '5.5',
    windowSize: 10000,
    scrollTimeout: '30s'
  }
};
