/* eslint-env node */
const path = require('path');
const pEnv = process.env;
const port = Number(pEnv['PORT'] || '8000');
const pallete = require('./pallete.json');
const env = {};

for(const k in pEnv) {
  if (k.startsWith('ENV_')) {
    let v = pEnv[k];
    if (/^\d+$/.test(v)) v = Number(v);
    env[k.substring(4)] = v;
  }
}

// 检测色板
(function () {
  if (!pallete.white || !pallete.black) {
    throw new Error('pallete error');
  }
  const whiteNames = Object.keys(pallete.white);
  const blackNames = Object.keys(pallete.black);
  if (whiteNames.length !== blackNames.length) {
    throw new Error('黑白两板色板颜色数量不一致');
  }
  whiteNames.forEach(n => {
    if (!pallete.black.hasOwnProperty(n)) {
      throw new Error('黑白两板色板的颜色名称不一致');
    }
  });
  pallete.names = whiteNames;
})();

module.exports = {
  pkgName: require('./package.json').name,
  buildMode: pEnv.BUILD_MODE === 'true',
  webpackDevtool: pEnv.DEV_TOOL || 'source-map',
  root: __dirname,
  env,
  pallete,
  noColor: pEnv.hasOwnProperty('NO_COLOR'),
  noCompress: pEnv.hasOwnProperty('NO_COMPRESS'),
  mock: {
    dir: path.join(__dirname, 'mock'),
    enable: pEnv['MOCK_ENABLE'] !== 'false',
    /**
     * 在所有 mock handler 执行前执行的中间件，
     *   比如以下代码使得所有 handler 暂停 3 秒。
     * 该中间件中也可以使用 this.success/this.error，
     *   一但返回了数据，handler 将不再执行。
     * before: async () {
     *   await this.sleep(3000);
     * }
     */
    before: null,
    /**
     * route 参数可以是一个函数，用于注册路由
     * route: router => {
     *   router.get('/aaa/bbb', async () => {});
     * }
     */
    route: null,
    /**
     * 定义 mock 的规则，每个规则的形式如下：
     * {
     *  // 需要匹配的前缀，支持字符串或正则
     *  // 如果是字符串，则使用 startsWith 判断，
     *  // 如果是正则表达式，则直接使用正则判断。
     *  prefix: '/user/session',
     *  // 是否需要将前缀裁剪掉
     *  cut: false,
     *  // 是否启用该规则
     *  enable: true
     * }
     */
    rules: []
  },
  proxy: {
    enable: pEnv['PROXY_ENABLE'] !== 'false',
    // proxy 转发的全局默认 remote
    remote: process.env['PROXY_REMOTE'] || 'http://127.0.0.1:8081',
    timeout: 10000,
    /*
     * 定义转发规则，每个规则形式如下：
     * {
     *   // 需要匹配的前缀，支持字符串或正则
     *   // 如果是字符串，则使用 startsWith 判断，
     *   // 如果是正则表达式，则直接使用正则判断。
     *   prefix: '/',
     *   // 是否需要将前缀裁剪掉
     *   cut: false,
     *   // 该规则是否生效
     *   enable: true,
     *   // 此处的 remote 参数用于指定该规则的转发 remote
     *   // 当此处不指定 remote 参数时，使用全局的 remote 参数
     *   remote: 'http://127.0.0.1:8081'
     * }
     */
    rules: []
  },
  server: {
    host: '0.0.0.0',
    port,
    /**
     * before 用于注册钩子，参看 bin/script/server.js 源码
     * before: async server => {
     *   return false;
     * }
     * 如果该钩子返回 true，则代表已经处理了这次请求，不再继续。
     */
    before: null
  },
  /**
   * 以下指定了依赖的所有第三方库。
   *   统一采用 npm 库，如果某个库没有发布到 npm，则自己 fork 然后发布。
   *   默认 min 版本和原始版本在同一个目录下，当不在同一个目录下时，
   *   通过数组的第二个参数指定相对路径。
   *   比如 moment 库的 min 版本在 moment/min/moment.min.js
   */
  libs: [
    ['react/umd/react.development.js', './react.production.min.js'],
    ['react-dom/umd/react-dom.development.js', './react-dom.production.min.js'],
    '@uirouter/react/_bundles/ui-router-react.js',
    'antd-mobile/dist/antd-mobile.js',
    'antd-mobile/dist/antd-mobile.css'
  ],
  /**
   * 打包时的外部引用。
   * 同时用于 entry 和业务模块的打包。
   */
  bundleExternals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'antd-mobile': 'window[\'antd-mobile\']',
    '@uirouter/react': 'UIRouterReact'
  },
  /*
   * 打包时的 alias
   */
  bundleAlias: {
    'config': path.join(__dirname, 'entry/boot/config.js'),
    'util': path.join(__dirname, 'entry/util'),
    'env': path.join(__dirname, 'entry/boot/env.js'),
    'i18n': path.join(__dirname, 'entry/service/i18n'),
    'router': path.join(__dirname, 'entry/boot/router.js'),
    'user': path.join(__dirname, 'entry/service/common/user.js')
  }
};
