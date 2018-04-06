const path = require('path');
const fs = require('fs');

function exists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch(ex) {
    return false;
  }
}
function isObj(v) { return typeof v === 'object' && v !== null; }
/**
 * 合并配置文件。只进行最多两层的合并，
 *   默认所有字段采用 override 策略合并，
 *   但对于第一层的数组进行 concat 合并，
 *   对第二层的数组才是 override
 */
function merge(cfgs) {
  return cfgs.reduce((pv, cv) => {
    for(const k in cv) {
      const v1 = pv[k];
      const v2 = cv[k];
      if (Array.isArray(v2) && Array.isArray(v1)) {
        pv[k] = v1.concat(v2);
      } else if (isObj(v1) && isObj(v2)) {
        Object.assign(v1, v2);
      } else {
        pv[k] = v2;
      }
    }
    return pv;
  }, {});
}

const cfgs = [require(path.join(process.cwd(), 'dev.config.js'))];

if (exists(path.join(process.cwd(), 'dev.custom.config.js'))) {
  const customConfig = require(path.join(process.cwd(), 'dev.custom.config.js'));
  cfgs.push(customConfig);
}
const config = merge(cfgs);

if (!config.noColor) {
  require('colors');
}

module.exports = config;
