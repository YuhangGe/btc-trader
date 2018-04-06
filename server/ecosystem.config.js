const path = require('path');
const fs = require('fs');
const total = require('os').cpus().length;
const appName = require('./package.json').name;

const PROD_APP = {
  name      : appName,
  merge_logs: true,
  log_date_format : "YYYY-MM-DD HH:mm:ss.SSS Z",
  out_file  : `${appName}.out.log`,
  error_file: `${appName}.err.log`,
  script    : 'app/index.js',
  instances : Math.min(total, 10),
  exec_mode : 'cluster',
  env : {
    NODE_ENV: 'production'
  }
};

const DEV_APP = {
  name: 'dev__' + appName,
  script: 'app/index.js',
  autorestart: false,
  watch: true,
  ignore_watch: [
    'node_modules',
    '.idea',
    '.git',
    '.tmp',
    '.vscode',
    'run',
    'dist',
    'script'
  ],
  env: {
    NODE_ENV: 'development'
  }
};

module.exports = {
  apps : [ PROD_APP, DEV_APP ]
};