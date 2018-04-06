/**
 * 用于加载整个系统的加载器入口。
 */
import * as _util from './util';
import env from '../boot/env';

env.URL_API_ROOT = _util.joinUrl(env.URL_SERVER_ROOT, env.URL_API_PREFIX);
env.URL_ASSET_ROOT = _util.joinUrl(env.URL_SERVER_ROOT, env.URL_ASSET_PREFIX);
const cUrl = location.href.replace(location.protocol + '//' + location.host, '');
const loginUrl = _util.joinUrl(env.URL_SERVER_ROOT, env.URL_LOGIN);
const isLoginPage = cUrl === loginUrl || cUrl.startsWith(loginUrl + '?');
const userInfo = window.__AppBootInfo.user;

if (isLoginPage) {
  _load().catch(_err);
} else {
  window.fetch(_util.joinUrl(env.URL_API_ROOT, env.URL_SESSION), {
    credentials: 'same-origin'
  }).then(res => {
    if (res.status === 401) {
      return _load();
    } else if (res.status === 200) {
      return res.json().then(obj => {
        if (typeof obj.code === 'number' && obj.code !== 0) {
          return _load();
        } else if (obj.code === 0) {
          Object.assign(userInfo, obj.data);
        }
        return _load();
      });
    } else {
      _err(res.statusText);
    }
  }).catch(_err);
}

async function _load() {
  // 如果用户没有登录，则新建一个默认用户
  if (!userInfo.id) userInfo.username = 'guest';
  userInfo.locale = _util.getLocale(userInfo);
  userInfo.theme = userInfo.theme || env.DEFAULT_THEME || 'white';

  await Promise.all([
    _loadLocales().then(() => _loadScripts()),
    _loadThemes()
  ]);
  
  _boot();
}

function _loadScripts() {
  return Promise.all(
    window.__AppBootInfo.files.scripts.map(file => _util.loadScript(file))
  );
}

function _loadThemes() {
  return Promise.all(
    window.__AppBootInfo.files.themes.map(file => _util.loadStyle(file.replace('${theme}', userInfo.theme)))
  );
}

function _loadLocales() {
  return Promise.all(
    window.__AppBootInfo.files.locales.map(locFile => _util.loadLocale(locFile.replace('${locale}', userInfo.locale)))
  );
}

function _boot() {
  if (!isLoginPage && !userInfo.id) {
    window.history.replaceState(
      null,
      null,
      loginUrl + `?url=${encodeURIComponent(cUrl)}`
    );
  }
  if (!window.__AppBootInfo.bootstrap) _err('bootstrap entry not found.');
  else window.__AppBootInfo.bootstrap();
}
function _err(err) {
  /* eslint no-console:off */
  if (err) console.error(err);
  document.getElementById('splash_screen').innerHTML = '<p class="error">System load failed. Please contact website administrator.</p>';
}

