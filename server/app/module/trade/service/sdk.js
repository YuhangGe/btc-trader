const {
  config
} = require(__framework);

const moment = require('moment');
const crypto = require('crypto');
const request = require('request');
const Agent = require('socks5-https-client/lib/Agent');
const huobiCfg = config.huobi;

const EMPTY = {};

function calc(method, path, params) {
  const pars = [];
  if (path[0] !== '/') path = '/' + path;
  params = Object.assign(getParams(), params || EMPTY);
  for (const item in params) {
    if (typeof params[item] === 'undefined') continue;
    if (params[item] === null) continue;
    pars.push(item + '=' + encodeURIComponent(params[item]));
  }

  const p = pars.sort().join('&');
  const meta = [method, huobiCfg.apiHost, path, p].join('\n');
  const hmac = crypto.createHmac('sha256', huobiCfg.secretKey);
  hmac.update(meta);
  const Signature = encodeURIComponent(hmac.digest('base64'));
  return [method, `${path}?${p}&Signature=${Signature}`];
}

function getParams() {
  return {
    AccessKeyId: huobiCfg.accessKey,
    SignatureMethod: 'HmacSHA256',
    SignatureVersion: 2,
    Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
  };
}

function callApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    method = method.toUpperCase();
    if (path[0] !== '/') path = '/' + path;
    if (method !== 'GET' && method !== 'POST') {
      return reject(`Method ${method} not supported`);
    }
    const headers = {
      'Accept-Language': 'zh-cn',
      'Content-Type': method === 'POST' ? 'application/json' : 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
    };
    request({
      url: `https://${huobiCfg.apiHost}${path}`,
      body: JSON.stringify(body),
      method,
      timeout: 10000,
      headers,
      agentClass: Agent,
      agentOptions: {
        keepAlive: true,
        maxSockets: 256
      }
    }, (err, res, body) => {
      if (err) return reject(err);
      if (res.statusCode === 200) {
        try {
          const r = JSON.parse(body);
          if (r.status === 'ok') {
            resolve(r.data);
          } else {
            reject(r);
          }
        } catch(ex) {
          reject(ex);
        }
      } else {
        reject(res.statusText);
      }
    });
  });
}

async function _getAccountId() {
  if (!config.accountId) {
    console.log('fetching accounts');
    const accounts = await getAccounts();
    config.accountId = accounts[0].id;
    console.log('got account id', config.accountId);
  }
  return config.accountId;
}

function getAccounts(type = 'spot') {
  return callApi(...calc(
    'GET', 
    '/v1/account/accounts'
  )).then(accounts => {
    return accounts.filter(ac => ac.type === type && ac.state === 'working');
  });
}

const DEFAULT_GET_ORDERS_FILTERS = {
  symbol: null,
  type: null,
  states: 'submitted,partial-filled'
};
async function getOrders(filters) {
  filters = Object.assign({}, DEFAULT_GET_ORDERS_FILTERS, filters || {});  
  const orders = await callApi(...calc(
    'GET', 
    '/v1/order/orders', {
      symbol: filters.symbol,
      states: filters.states
    })
  );
  return orders.filter(order => {
    if (filters.type && filters.type.indexOf(order.type) < 0) return false;
    return true;
  });
}
async function getBuyOrders(filters = {}) {
  filters.type = 'buy-limit';
  return await getOrders(filters);
}

const ZERO_REG = /^0+\.0+$/;
const DEFAULT_GET_BALANCE_FILTERS = {
  noZero: true,
  type: 'trade',
  currency: null
};
async function getBalance(filters) {
  filters = Object.assign({}, DEFAULT_GET_BALANCE_FILTERS, filters || {});
  const accountId = await _getAccountId();
  const balance = await callApi(...calc(
    'GET',
    `/v1/account/accounts/${accountId}/balance`
  ));
  return balance.list.filter(it => {
    if (filters.noZero && ZERO_REG.test(it.balance)) return false;
    if (filters.type && filters.type.indexOf(it.type) < 0) return false;
    if (filters.currency && filters.currency.indexOf(it.currency) < 0) return false;
    return true;
  });
}

async function cancelOrder(orderId) {
  return await callApi(...calc(
    'POST',
    `/v1/order/orders/${orderId}/submitcancel`
  ));
}

async function cancelAllOrders(orderIds) {
  return await callApi(...calc(
    'POST',
    'v1/order/orders/batchcancel', {
      'order-ids': orderIds
    }
  ));
}

function sleep(mills) {
  return new Promise(res => {
    setTimeout(res, mills);
  });
}

async function getTimestamp() {
  return await callApi(...calc(
    'GET',
    '/v1/common/timestamp'
  ));
}

async function getKLine(symbol, period, size = 1) {
  return await callApi(...calc(
    'GET',
    '/market/history/kline', {
      symbol,
      period,
      size
    }
  ));
}

module.exports = {
  sleep,
  getTimestamp,
  getKLine,
  getAccounts,
  getOrders,
  getBuyOrders, 
  getBalance,
  cancelOrder,
  cancelAllOrders
};
