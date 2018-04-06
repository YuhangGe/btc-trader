#!/usr/bin/env node

const _util = require('./script/util');
const config = require('./script/config');
const map = {
  dev: 'dev.js',
  build: 'build.js',
  css: 'css/less.js',
  js: 'js/webpack.js',
  locale: 'locale/gen.js',
  serve: 'serve/server.js',
  html: 'html/gen.js',
  lint: 'lint/lint.js'
};

function _exit(err) {
  if (err) console.error(err);
  process.exit(err ? -1 : 0);
}
process.on('uncaughtException', _exit);

const cmd = process.argv[2];
if (!map.hasOwnProperty(cmd)) {
  console.error('Unknown command.');
  process.exit(-1);
}

process.env.BUILD_MODE = cmd === 'build' ? 'true' : 'false';

/*
 * windows 平台下，mkdir 在并发状态下有些诡异的问题。
 * 所以统一在所有平台都使用 mkdirSync 提前将所有需要的目录建好
 */
_util.walkMkdirSync([
  ['.tmp', [
    'css',
    'js',
    '.cache',
    '.lib',
    '__upload',
    // ['aaa', 'bbb'],
    // ['ccc', ['ddd', 'eee', ['fff', 'ggg']]]
  ]],
  ['dist', [
    'css',
    'js'
  ]]
], config.root);

try {
  require(`./script/${map[cmd]}`)().catch(_exit);  
} catch(ex) {
  _exit(ex);
}
