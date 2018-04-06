export default Object.assign({
  URL_SERVER_ROOT: '/',
  URL_WS: `ws${location.protocol === 'https:' ? 's' : ''}://${location.hostname}:${location.port}/__ws`,
  URL_API_PREFIX: '/__api/',
  URL_ASSET_PREFIX: '/__public/',
  URL_LOGIN: '/login',
  URL_SESSION: '/session'
}, window.__AppBootInfo.env);
