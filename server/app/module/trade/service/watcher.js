const {
  logger,
  config
} = require(__framework);
const mailer = require(__service + 'mailer');
const moment = require('moment');
const HB = require('./sdk');
const CONC = config.huobi.concurrency;

const Symbols = (function() {
  const allSymbols = config.huobi.symbols.replace(/[\n\s]/g, '').split(',').filter(it => !!it).sort();
  let clusterSymbols = allSymbols;
  const id = process.env['CLUSTER_ID'];
  const count = process.env['CLUSTER_COUNT'];
  if (id && count) {
    const ec = Math.ceil(allSymbols.length / parseInt(count));
    const es = parseInt(id) * ec;
    clusterSymbols = allSymbols.slice(es, es + ec);
    logger.info(clusterSymbols.join(','));
  }
  return clusterSymbols.map(s => ({
    name: `${s}usdt`,
    p15m: -1,
    p1h: -2
  }));
})();

let CheckMS = null;

function calcPercent(closeTick, openTick) {
  return Math.round((closeTick.close - openTick.open) * 10000 / openTick.open) / 100;
}

async function doCheck(ms) {
  const results = [];
  for(let i = 0; ; i+= CONC) {
    try {
      await Promise.all(Symbols.slice(i, i + CONC).map(symbol => {
        return checkSymbol(symbol, ms, results);
      }));
    } catch(ex) {
      console.error(ex);
    }
    if (CheckMS !== ms) return;
    if (i + CONC >= Symbols.length) break;
  }
  if (results.length > 0) {
    const importantS = results.map(r => r.symbol.name).sort().join(',');
    const time = moment().format('MM/DD HH:mm');
    logger.debug(importantS);
    await mailer.send(`火币-${time}: ${importantS}`, results.sort((ra, rb) => ra.symbol.name > rb.symbol.name ? 1 : -1).map(result => `
<h3>${result.symbol.name}</h3>
<div>
  <p>Hour: ${result.p1hs.join(', ')}</p>
  <p>15M : ${result.p15ms.join(', ')}</p>
</div>`).join('\n'));
  }
}

async function checkSymbol(symbol, ms, results) {
  const ks = await HB.getKLine(symbol.name, '15min', 8);
  if (CheckMS !== ms || ks.length !== 8) return;
  const ih = (ms / 15) | 0;
  const p15ms = [0, 1, 2, 3].map(i => calcPercent(ks[i], ks[i]));
  const p1hs = [calcPercent(ks[0], ks[ih]), calcPercent(ks[ih + 1], ks[ih + 4])];
  logger.log(symbol.name, p15ms[0], p1hs[0]);  
  let match = false;
  if (p15ms[0] <= symbol.p15m) {
    symbol.p15m = p15ms[0] - 1;
    match = true;
  }
  if (p1hs[0] <= symbol.p1h) {
    symbol.p1h = p1hs[0] - 1;
    match = true;
  }
  if (match && p15ms[0] < -1 && p15ms[1] < -1 && p1hs[0] < -2) {
    results.push({
      symbol,
      p15ms,
      p1hs
    });
  }
}

function check() {
  const ms = (new Date()).getMinutes();
  if (CheckMS === ms) return;
  CheckMS = ms;  
  if (ms === 0) Symbols.forEach(sym => sym.p1h = -2);
  if (ms % 15 === 0) Symbols.forEach(sym => sym.p15m = -1);
  doCheck(ms).catch(ex => logger.error(ex));
}
setInterval(check, 1000);
