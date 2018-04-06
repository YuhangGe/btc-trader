const url = require('url');
const cookie = require('cookie');
const _util = require('../script/util');
const config = require('../script/config');

module.exports = class Context {
  constructor(app, request, response) {
    this._app = app;
    this._originRequest = request;
    this._originResponse = response;
    this._query = null;
    this._body = null;
    this._files = [];
    this._code = 200;
    this._isSent = false;
    this._cookie = null;
  }
  get config() {
    return config;
  }
  get util() {
    return _util;
  }
  getCookie(name) {
    if (!this._cookie) {
      this._cookie = cookie.parse(this._originRequest.headers.cookie || '');
    }
    return this._cookie[name];
  }
  setCookie(name, value, opts = {}) {
    this._originResponse.setHeader('Set-Cookie', cookie.serialize(name, value, opts));
  }
  sleep(mills = 1000) {
    return new Promise(res => {
      setTimeout(res, mills);
    });
  }
  get logger() {
    return this._app._logger;
  }
  get url() {
    return this._originRequest.url;
  }
  get query() {
    if (!this._query) {
      this._query = url.parse(this.url, true).query;
    }
    return this._query;
  }
  get body() {
    return this._body;
  }
  get files() {
    return this._files;
  }
  get response() {
    return this._originResponse;
  }
  get request() {
    return this._originRequest;
  }
  success(data) {
    if (this._isSent || this._originResponse.finished) throw new Error('has sent!');
    this._send(200, data instanceof Buffer ? data : {
      code: 0,
      data: data || null
    });
  }
  error(code, message) {
    if (this._isSent || this._originResponse.finished) throw new Error('has sent!');
    if (typeof code === 'string') {
      message = code;
      code = 1000;
    }
    this._send(code < 1000 ? code : 200, {
      code: code < 1000 ? code : 1000,
      data: message || ''
    });
  }
  _send(statusCode, data) {
    if (this._isSent || this._originResponse.finished) throw new Error('has sent!');
    const res = this._originResponse;    
    if (data instanceof Buffer) {
      res.writeHead(statusCode);
      res.write(data);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(statusCode);
      res.write(JSON.stringify(data, null, 2));
    }
    res.end();
    this._isSent = true;
  }
};
