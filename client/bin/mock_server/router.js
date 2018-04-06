const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
const LOG_ROUTER = process.env['LOG_MOCK_ROUTER'] === 'true';

function concatUrl(url, sub, sep = '/') {
  let newUrl = (url + sep + sub).replace(/\/+/g, '/');
  if (newUrl[0] !== '/') {
    newUrl = '/' + newUrl;
  }
  return newUrl;
}

class Handler {
  constructor(fn, params) {
    this.fn = fn;
    this.params = params;
    this.reg = null;
  }
  generate(params) {
    return new Handler(this.fn, params);
  }
}

class Group {
  constructor(map, name = '', parent = null) {
    this.name = name;
    this.url = concatUrl(parent? parent.url : '', name);
    this.map = map;
  }
  _route(method, _url, handler, concatUrlSep = '/') {
    if (typeof _url === 'function') {
      handler = _url;
      _url = '';
    }
    _url = concatUrl(this.url, _url, concatUrlSep);
    let _mm = this.map.get(_url);
    if (!_mm) {
      _mm = new Map();
      this.map.set(_url, _mm);
    }
    if (_mm.has(method)) {
      console.error(`Duplicate route define, METHOD ${method}, URL ${_url}.`);
    } else {
      _mm.set(method, new Handler(handler));
    }
    return this;
  }
  get(url, handler) {
    return this._route('GET', url, handler);
  }
  put(url, handler) {
    return this._route('PUT', url, handler);
  }
  post(url, handler) {
    return this._route('POST', url, handler);
  }
  del(url, handler) {
    return this._route('DELETE', url, handler);
  }
  head(url, handler) {
    return this._route('HEAD', url, handler);
  }
  options(url, handler) {
    return this._route('OPTIONS', url, handler);
  }
  all(url, handler) {
    for(let i = 0; i < METHODS.length; i++) {
      this._route(METHODS[i], url, handler);
    }
    return this;
  }
  rest(url, handler) {
    if (typeof url === 'object') {
      handler = url;
      url = '';
    }
    handler.list && this._route('GET', url, handler.list, '');
    handler.create && this._route('POST', url, handler.create, '');
    handler.update && this.put(`${url + '/'}:id`, handler.update);
    handler.remove && this.del(`${url + '/'}:id`, handler.remove);
    handler.view && this.get(`${url + '/'}:id`, handler.view);
    return this;
  }
  group(url) {
    return new Group(this.map, url, this);
  }
  destroy() {
    this.map = null;
  }
}
class Router {
  constructor() {
    this._tmp = new Map();
    this._root = new Group(this._tmp);
    this._handlers = {
      'GET': [],
      'POST': [],
      'PUT': [],
      'DELETE': [],
      'HEAD': [],
      'OPTIONS': []
    };
  }
  match(method, url) {
    if (!this._handlers.hasOwnProperty(method)) {
      return undefined;
    }
    if (url[0] !== '/') url = '/' + url;
    const handlers = this._handlers[method];
    let handler = undefined;
    for(let i = 0; i < handlers.length; i++) {
      const h = handlers[i];
      const m = url.match(h.reg);
      if (!m) {
        continue;
      }
      handler = h.generate(m.length > 1 ? m.slice(1) : undefined);
      break;
    }
    return handler;
  }
  build() {
    const _check = {};
    this._tmp.forEach((handlers, url) => {
      if (url !== '/' && url[url.length - 1] === '/') {
        url = url.substring(0, url.length - 1);
      }
      const urlReg = '^' + url.replace(/\/:[^/]+/g, '/([^\\/]+)').replace(/\//g, '\\/') + '(?:\\/?)(?:\\?|$)';
      handlers.forEach((handler, method) => {
        handler.reg = new RegExp(urlReg);
        LOG_ROUTER && console.log(`[Mock Server] add router: ${method} ${url} ${handler.reg.toString()}`);
        this._handlers[method].push(handler);
        if (!_check[method]) _check[method] = {};
        if (_check[method][handler.reg.toString()]) {
          console.log('[Mock Server] duplicate router is not allowed'.red);
          process.exit(0);
        } else {
          _check[method][handler.reg.toString()] = true;
        }
      });
      handlers.clear();
    });
    this._root.destroy();
    this._tmp.clear();
    this._tmp = null;
    this._root = null;
  }
  /*
   * route helper
   */
  get(url, handler) {
    this._root.get(url, handler);
    return this;
  }

  post(url, handler) {
    this._root.post(url, handler);
    return this;
  }

  rest(url, handler) {
    this._root.rest(url, handler);
    return this;
  }

  put(url, handler) {
    this._root.put(url, handler);
    return this;
  }

  del(url, handler) {
    this._root.del(url, handler);
    return this;
  }

  head(url, handler) {
    this._root.head(url, handler);
    return this;
  }

  group(url, handler) {
    return this._root.group(url, handler);
  }

  options(url, handler) {
    this._root.options(url, handler);
    return this;
  }

  all(url, handler) {
    this._root.all(url, handler);
    return this;
  }
}

module.exports = Router;
