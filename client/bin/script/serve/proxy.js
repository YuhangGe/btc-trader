const URL = require('url');
const http = require('http');
const config = require('../config');

function dealRule(url, rule, cut = false, hook = null) {
  let found = false;
  if (typeof rule === 'string') {
    if (url.startsWith(rule)) {
      found = true;
      if (cut) url = url.substring(rule.length - 1);
    }
  } else if (rule instanceof RegExp) {
    const m = url.match(rule);
    if (m) {
      found = true;
      if (cut) url = url.substring(m[0].length);
    }
  } else if (typeof rule === 'function') {
    found = rule(url);
  } else if (typeof rule === 'object' && rule !== null && rule.enable !== false) {
    return dealRule(url, rule.prefix, rule.cut, rule.hook);
  }

  return {
    found,
    url,
    hook
  };
}

function devProxy(request, response) {
  if (!config.proxy.enable) {
    return false;
  }
  const rules = config.proxy.rules || [];
  let result = false;
  for(let i = 0; i < rules.length; i++) {
    result = dealRule(request.url, rules[i]);
    if (result.found) {
      result.remote = rules[i].remote || config.proxy.remote;
      break;
    }
  }
  if (!result || !result.found) {
    return false;
  }
  return _handleProxy(request, response, result.remote + '/' + result.url);  
}

function _handleProxy(request, response, remoteUrl) {
  const remote = remoteUrl.replace(/\/+/g, '/').replace('http:/', 'http://');
  const info = URL.parse(remote);
  console.log(`Proxy => ${request.method.yellow} ${remote.green}`);  
  let ended = false;
  const req = http.request({
    hostname: info.hostname,
    port: info.port || 80,
    method: request.method,
    path: info.path,
    headers: request.headers,
    timeout: 10000
  }, res => {
    if (ended) return;
    response.writeHead(res.statusCode, res.headers);
    res.on('data', chunk => {
      if (ended) return;
      response.write(chunk);
    });
    res.on('end', () => {
      if (ended) return;
      ended = true;
      response.end();
    });
    res.on('error', _err);
  }).on('error', _err);
  request.on('data', chunk => {
    req.write(chunk);
  }).on('end', () => {
    if (ended) return;
    req.end();
  }).on('error', _err);

  function _err(err) {
    console.log(err);
    if (ended) return;
    ended = true;
    req.end();
    response.writeHead(500);
    response.end('Backend Connection Error.\n' + (err.stack || err.message || err.toString()));
  }
  return true;
}

module.exports = devProxy;