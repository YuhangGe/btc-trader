const WSServer = require('ws').Server;
const fs = require('fs');
const http = require('http');
const config = require('../config');
const path = require('path');
const _static = require('./static');
const mock = require('./mock');
const proxy = require('./proxy');
const URL_API_PREFIX = config.env.URL_API_PREFIX || '/__api/';
const URL_ASSET_PREFIX = config.env.URL_ASSET_PREFIX || '/__public/';
const liveReloadClients = [];

function reload() {
  console.log('Page reload.');
  liveReloadClients.forEach(ws => {
    try {
      ws.send('reload');
    } catch(ex) {
      console.log(ex);
    }
  });
}

function initLiveReload(server) {
  const wServer = new WSServer({
    server,
  });
  wServer.on('connection',  ws => {
    liveReloadClients.push(ws);
    ws.on('close', _des);
    ws.on('error', _des);
    function _des(err) {
      if (typeof err === 'object' && err && err.code !== 'ECONNRESET') {
        console.log(err);
      }
      const idx = liveReloadClients.indexOf(ws);
      idx >= 0 && liveReloadClients.splice(idx, 1);
      ws.removeListener('close', _des);
      ws.removeListener('error', _des);
    }
  });
}


function _serveAll(scanDir, target, isComponent) {
  // detect if dir exists
  try { fs.accessSync(scanDir); } catch(ex) { return; }
  
  // scan all sub dirs
  fs.readdirSync(scanDir).forEach(dir => {
    try {
      const assetDir = path.join(scanDir, `${dir}/asset`);
      const st = fs.statSync(assetDir);
      if (!st.isDirectory()) return;
      if (target.hasOwnProperty(dir)) {
        return console.error((isComponent 
          ? '公共业务组件名不能重复，请注意检查是否和组件库里的组件名冲突'
          : '一级模块的名称，不能是保留的 component, demo, global 之一。'
        ).red);
      }
      target[dir] = _static(assetDir);
    } catch(ex) {
      // ignore
    }
  });
}

// const serveAce = _static(path.join(config.entryRoot, 'node_modules/ace-builds/src-noconflict'));
const serve = _static(path.join(config.root, config.buildMode ? 'dist' : '.tmp'));
const serves = {
  component: {}
};
_serveAll(path.join(config.root, 'module'), serves, false);
_serveAll(path.join(config.root, 'component'), serves.component, true);

async function handleAsset(request, response) {
  // build mode
  if (config.buildMode) {
    return await serve(request, response);
  }
  // dev mode
  const url = request.url;
  // if (url.startsWith('/js/ace/')) {
  //   request.url = url.substring(7);
  //   return await serveAce(request, response);
  // }
  // serve source files
  if (/\.(js|css|map)$/.test(url) || url === '/index.html') {
    request.url = url.replace(/^\/?(\.tmp)\//, '/');
    return await serve(request, response);
  }
  const mn = url.match(/^\/(\w+)\/(\w+)\//);
  if (!mn) return false;
  let targetServe = serves;
  let moduleId = mn[1];
  if (moduleId === 'component') {
    /*
     * 如果是以 /component/ 打头，则是要访问组件的 asset，
     * 这时候 mn[2] 代表具体的组件名称。
     */
    request.url = url.substring(moduleId.length + mn[2].length + 2);
    moduleId = mn[2];
    targetServe = serves.component;
  } else {
    request.url = url.substring(moduleId.length + 1);
  }
  if (targetServe.hasOwnProperty(moduleId)) {
    return await targetServe[moduleId](request, response);
  } else {
    return false;
  }
}

async function handle(request, response) {
  if (config.server.before && (await config.server.before(request, response))) {
    return;
  }
  const url = request.url;
  if (url.startsWith(URL_API_PREFIX)) {
    request.url = url.substring(URL_API_PREFIX.length - 1);
    if ((await mock(request, response)) || (await proxy(request, response))) {
      return;
    }
  } else if (url.startsWith(URL_ASSET_PREFIX)) {
    request.url = url.substring(URL_ASSET_PREFIX.length - 1);
    if (await handleAsset(request, response)) {
      return;
    }
  } else if (!config.buildMode) {
    request.url = '/index.html';
    await handleAsset(request, response);
    return;
  }
  response.writeHead(404);
  response.end();
}

async function createDevServer() {
  const server = http.createServer((request, response) => {
    handle(request, response).catch(err => {
      response.writeHead(500);
      response.end();
      console.log(err);
    });
  });
  
  if (!config.buildMode) {
    initLiveReload(server);
  }
  
  server.reload = reload;
  server.reloadMock = function() {
    mock.reload();
  };
  await new Promise(res => {
    server.listen(config.server.port, config.server.host, () => {
      console.log('Dev Server Listening at', `${config.server.host}:${config.server.port}`.green);
      res();
    });
  });
  
  return server;
}

module.exports = createDevServer;

