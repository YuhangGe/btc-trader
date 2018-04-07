const HB = require('../module/trade/service/sdk');
const moment = require('moment');
const SYMBOLS = process.env['SYMBOLS'] || `
  btc,bch,eth,etc,ltc,eos,xrp,
  omg,dash,zec,ada,act,btm,bts,
  ont,iost,ht,trx,dta,neo,qtum,
  ela,ven,theta,snt,zil,xem,smt,
  nas,ruff,hsr,let,mds,storj,elf,itc,cvc,gnt
`;


const SysInfo = {
  symbols: SYMBOLS.replace(/[\n\s]/g, '').split(',').filter(it => !!it).map(s => `${s}usdt`),
  CHECK_INTERVAL: 5000,
  checkTS: 0,
  symbolMap: {},
  sends: []
};

SysInfo.symbols.forEach(symbol => {
  SysInfo.symbolMap[symbol] = {
    ms: null
  };
});

function calcPercent(tick) {
  return Math.round((tick.close - tick.open) * 10000 / tick.open) / 100;
}
async function doCheck() {
  const ts = await HB.getTimestamp();
  for(let i = 0; i < SysInfo.symbols.length; i++) {
    try {
      await checkSymbol(SysInfo.symbols[i], (moment(ts).minutes() / 15) | 0);
    } catch(ex) {
      console.error(ex);
    }
  }
  console.log('\n\n**********************\n\n');
  if (SysInfo.sends.length > 0) {
    console.log(SysInfo.sends.map(info => {
      return `${info.level}级：${info.symbol}`;
    }).join('\n'), '\n\n**********************\n\n');
  }
}

async function checkSymbol(symbol, ms) {
  const info = SysInfo.symbolMap[symbol];
  if (info.ms === ms) return;

  const results = await Promise.all([
    HB.getKLine(symbol, '15min', 2),
    HB.getKLine(symbol, '60min', 1)
  ]);
  
  const pre15Percent = calcPercent(results[0][1]);
  const cur15Percent = calcPercent(results[0][0]);
  const cur60Percent = calcPercent(results[1][0]);
  
  console.log(symbol, ':', cur60Percent, pre15Percent, cur15Percent);

  if (cur60Percent <= -2.0 && pre15Percent <= -1.0 && cur15Percent <= -0.5) {
    info.ms = ms;
    SysInfo.sends.push({
      symbol,
      level: 1
    });
  } else if (pre15Percent <= -1.0 && cur15Percent <= -0.5) {
    info.ms = ms;
    SysInfo.sends.push({
      symbol,
      level: 2
    });
  } else if (cur60Percent <= -2.0 && cur15Percent <= -1.0) {
    info.ms = ms;
    SysInfo.sends.push({
      symbol,
      level: 3
    });
  } else if (cur15Percent <= -1.0) {
    info.ms = ms;
    SysInfo.sends.push({
      symbol,
      level: 4
    });
  }
}

function check() {
  SysInfo.checkTS = Date.now();
  doCheck().then(() => {
    const passed = Date.now() - SysInfo.checkTS;
    setTimeout(check, passed >= SysInfo.CHECK_INTERVAL ? 0 : SysInfo.CHECK_INTERVAL - passed);
  }, ex => {
    console.error(ex);
    const passed = Date.now() - SysInfo.checkTS;
    setTimeout(check, passed >= SysInfo.CHECK_INTERVAL ? 0 : SysInfo.CHECK_INTERVAL - passed);
  });
}
check();
