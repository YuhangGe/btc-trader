import { joinUrl, appendUrlQuery } from 'util';
import env from 'env';
import { t } from 'i18n';
import {
  isUndefined
} from 'lodash';

const API_ROOT = joinUrl(env.URL_SERVER_ROOT, env.URL_API_PREFIX);
const FULL_URL_REG = /^http(?:s?):/;
const ACEEPT_BODY_METHODS = ['POST', 'PUT', 'DELETE'];
const ABORTED_ERROR = {
  message: 'The operation was aborted.'
};
function fetch(url, options = {}) {
  const p = new Promise((resolve, reject) => {
    if (typeof url === 'object') {
      options = url;
      url = options.url;
    }
    if (!url) {
      throw new Error('fetch need url');
    }
    if (options.urlPrefix) {
      url = joinUrl(options.urlPrefix, url);
    } else if (!FULL_URL_REG.test(url)) {
      url = joinUrl(API_ROOT, url);
    }
    options.method = options.method || 'GET';
    let params = options.params || options.query;
    const data = typeof options.data !== 'undefined' ? options.data : options.body;
    const acceptBody = ACEEPT_BODY_METHODS.indexOf(options.method) >= 0;
    if (!acceptBody && !params && typeof data !== 'undefined') {
      params = data;
    }
    if (typeof params !== 'undefined') {
      url = appendUrlQuery(url, params);
    }
    options.credentials = options.credentials || 'same-origin';      
    options.headers = options.headers || {};
    if (acceptBody) {
      let contentType = options.contentType || options.headers['Content-Type'] || 'json';
      if (contentType === 'json') {
        contentType = 'application/json';
      } else if (contentType === 'form') {
        contentType = 'application/x-www-form-urlencoded';
      } else if (contentType === 'multipart' || contentType === 'file') {
        contentType = 'multipart/form-data';
      } else if (typeof options.data === 'string' || contentType === 'text') {
        contentType = 'raw';
      }
      options.headers['Content-Type'] = contentType;
      if (typeof data === 'undefined') {
        options.body = '';
      } else if (contentType === 'raw') {
        options.body = data;
      } else if (contentType === 'application/json') {
        options.body = JSON.stringify(data);
      } else if (contentType === 'application/x-www-form-urlencoded') {
        throw new Error('not implement');
      } else {
        throw new Error('not implement');
      }
    }
    let _state = 0;
    if (!isUndefined(options.signal) && isUndefined(window.AbortController)) {
      const signal = options.signal;
      _state = 1;
      signal.on('abort', function() {
        signal.removeAllListeners();
        if (_state === 1 || _state === 2) {
          _state = 3;
          reject(ABORTED_ERROR);
        }
      });
    }
    window.fetch(url, options).then(res => {
      if (_state === 0) {
        return fetchHandler(res, options).then(resolve, reject);
      } else if (_state === 3) return;
      _state = 2;
      fetchHandler(res, options).then((result) => {
        if (_state === 3) return;
        _state = 3;
        options.signal.removeAllListeners();
        resolve(result);
      }, err => {
        if (_state === 3) return;
        _state = 3;
        options.signal.removeAllListeners();        
        reject(err);
      });
    }).catch(err => {
      logger.error(err);
      reject({
        message: err.message || err.toString()
      });
    });
  });
  return p;
}
// 这行代码很重要，注册到 window 上以便给 _intro.js 使用
window.__$fetch = fetch;

export function jumpToLogin() {
  const cUrl = window.location.href.replace(location.protocol + '//' + location.host, '');
  const loginUrl = joinUrl(env.URL_SERVER_ROOT, env.URL_LOGIN);
  if (cUrl !== loginUrl && !cUrl.startsWith(loginUrl + '?')) {
    window.history.replaceState(
      null,
      null,
      loginUrl + `?url=${encodeURIComponent(cUrl)}`
    );
  }

}

function fetchHandler(response, options) {
  return new Promise((resolve, reject) => {
    if (response.status === 401 && options.auth !== false) {
      jumpToLogin();
      reject({
        status: 401,
        message: t('global.error.unauthorized')
      });
      return;
    }

    if (options.handleResponse === false) {
      return resolve(response);
    } else if (typeof options.handleResponse === 'function') {
      return options.handleResponse(response).then(resolve, reject);
    }
    if (response.status >= 200 && response.status < 300) {
      if (options.method === 'HEAD') resolve();
      const responseType = options.responseType || 'json';
      if (responseType === 'text') {
        response.text().then(resolve, reject);
      } else if (responseType === 'json') {
        response.json().then(obj => {
          if (typeof obj.code !== 'undefined') {
            if (obj.code === 0) {
              resolve(obj.data);
            } else {
              const msg = typeof obj.data === 'object' && obj.data
                ? t(obj.data.message, obj.data.params)
                : t(obj.data);
              reject({
                status: obj.code,
                message: msg
              });
            }
          } else {
            resolve(obj);
          }
        }, reject);
      } else {
        throw new Error(`responseType ${responseType} not support`);
      }
    } else {
      logger.error(response);
      reject({
        message: t(typeof response.body === 'string' ? response.body : 'global.error.network'),
        status: response.status
      });
    }
  });
}