const path = require('path');
const _util = require('../script/util');
const config = require('../script/config');
const Router = require('./router');
const Context = require('./context');
const querystring = require('querystring');
const formidable = require('formidable');

function dealRule(url, rule, cut = false) {
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
    return dealRule(url, rule.prefix, rule.cut);
  }

  return {
    found,
    url
  };
}

function _log(...args) {
  console.log(...args);
}
const SimpleLogger = {
  log: _log,
  debug: _log,
  error: _log,
  info: _log,
  warn: _log
};

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk.toString();
    });
    request.on('end', () => {
      body = body === '' ? '{}' : body;
      resolve(body);
    });
    request.on('error', err => {
      reject(err);
    });
  });
}

class MockServer {
  constructor(cfg) {
    this._mockDir = cfg.dir;
    this._mockRoute = cfg.route;
    this._mockRules = cfg.rules;
    this._mockBeforeHandler = cfg.before;
    this._initInfo = {
      finished: false,
      promise: null,
    };
    this._logger = SimpleLogger;
    this._router = new Router();
  }

  initialize() {
    if (this._initInfo.finished) return Promise.resolve();
    if (this._initInfo.promise) return this._initInfo.promise;
    this._initInfo.promise = new Promise((resolve, reject) => {
      this._scan(this._mockDir, this._router).then(() => {
        if (this._mockRoute) {
          this._mockRoute(this._router);
        }
        this._router.build();
        this._initInfo.finished = true;
        this._initInfo.promise = null;
        resolve();
      }, reject);
    });
    return this._initInfo.promise;
  }

  async _scan(dir, router, parentRoute = '/') {
    const files = await _util.readdir(dir);
    for (let i = 0; i < files.length; i++) {
      const sf = files[i];
      const bf = path.basename(sf.trim(), '.js').trim().replace(/\{\s*([\w\d$_]+)\s*\}/, (m0, m1) => `:${m1}`);
      if (bf.startsWith('.')) continue; // skip
      const stat = await _util.stat(path.join(dir, sf));
      if (stat.isDirectory()) {
        await this._scan(
          path.join(dir, sf),
          router.group(bf),
          path.join(parentRoute, bf)
        );
      } else if (stat.isFile() && /\.js$/.test(sf)) {
        /**
         * 对于 __ 打头的文件，不视为路由。这一类的文件可用于
         * 复杂 mock 逻辑时的公用逻辑（service)
         */
        if (sf.startsWith('__')) continue;
        let handler = null;
        try {
          handler = require(path.join(dir, sf));
        } catch (ex) {
          console.error(ex);
          continue;
        }
        if (bf === 'REST') {
          return router.rest(handler);
        }
        if (typeof handler !== 'function') {
          console.error(`ERROR: mock handler "${path.relative(config.root, sf)}" must be function!`.red);
          continue;
        }
        const bm = bf.match(/^(GET|POST|PUT|DELETE|DEL|HEAD)(?:\s+([\w\d$:]+))?$/i);
        if (bm && bm[2]) {
          router[bm[1] === 'DELETE' ? 'del' : bm[1].toLowerCase()](bm[2], handler);
        } else if (bm) {
          router[bm[1] === 'DELETE' ? 'del' : bm[1].toLowerCase()](handler);          
        } else {
          router.all(
            bf,
            handler
          );
        }
      } else if (stat.isFile() && /\.json$/.test(sf)) {
        const rtn = await _util.readFile(path.join(dir, sf), 'utf-8');
        router.all(path.basename(sf, '.json'), () => rtn);
      }
    }
  }

  async handle(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    const rules = this._mockRules || [];
    let result = false;
    const URL = request.url;
    for(let i = 0; i < rules.length; i++) {
      result = dealRule(URL, rules[i]);
      if (result.found) break;
    }
    if (!result || !result.found) {
      return false;
    }

    if (!this._initInfo.finished) {
      console.log('Mock server is not ready.'.orange);
      return false;
    }
    const handler = this._router.match(request.method, result.url);
    if (!handler) {
      console.log('[Mock server] handler for', (request.method + ' ' + request.url).yellow, 'not found.');
      return false;
    }

    const ctx = new Context(this, request, response);

    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      const ct = request.headers['content-type'];
      if (ct && ct.startsWith('application/x-www-form-urlencoded')) {
        ctx._body = querystring.parse((await parseBody(request)));
      } else if (ct && (
        ct.startsWith('application/json') ||
        ct.startsWith('application/json-patch+json') ||
        ct.startsWith('application/vnd.api+json') ||
        ct.startsWith('application/csp-report'))
      ) {
        ctx._body = JSON.parse((await parseBody(request)));
      } else if (ct && ct.startsWith('multipart/form-data')) {
        const uploadDir = path.join(config.root, '.tmp', '__upload');
        await new Promise((resolve, reject) => {
          const form = new formidable.IncomingForm();
          form.uploadDir = uploadDir;
          form.keepExtensions = true;
          form.parse(request, function(err, fields, files) {
            if (err) {
              reject(err);
            } else {
              ctx._files = files;
              ctx._body = fields;
              resolve();
            }
          });
        });

      } else {
        ctx._body = await parseBody(request);
      }
    }
    if (this._mockBeforeHandler) {
      await this._mockBeforeHandler.apply(ctx);
      if (ctx._isSent || response.finished) return true;
    }
    const m = await handler.fn.apply(ctx, handler.params);
    if (ctx._isSent || response.finished) return true;
    ctx.success(m);
    return true;
  }
}

module.exports = MockServer;