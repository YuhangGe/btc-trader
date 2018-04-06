const path = require('path');
const config = require('../config');
const stylelint = require('stylelint');
const valueParser = require('postcss-value-parser');
const ruleName = `${config.pkgName}/strict-color`;
const messages =  stylelint.utils.ruleMessages(ruleName, {
  rejected: color => `Color not in pallete: "${color}"`
});
const palleteMap = (function() {
  const { white, black } = require(path.join(config.entryRoot, 'pallete.json'));
  if (!white || !black) throw new Error('pallete.json 色板不合法');
  const ws = Object.keys(white);
  const bs = Object.keys(black);
  if (ws.length !== bs.length) throw new Error(`pallete.json 黑白色板颜色数量不一致：${bs.length} ${ws.length}`);
  const whiteMap = {};
  const blackMap = {};
  ws.forEach((wn, i) => {
    if (!black.hasOwnProperty(wn)) throw new Error(`pallete.json 黑白色板颜色名称不一致：${wn}`);
    if (whiteMap[white[wn]]) throw new Error('pallete.json 白色主题色板颜色重复：' + white[wn]);
    if (blackMap[black[bs[i]]]) throw new Error('pallete.json 白色主题色板颜色重复：' + black[bs[i]]);
    whiteMap[white[wn]] = wn;
    blackMap[black[bs[i]]] = bs[i];
  });
  return {
    white: whiteMap,
    black: blackMap
  };
})();
const rule = stylelint.createPlugin(
  ruleName, 
  (expectation, options, context) => {
    return function(root, result) {
      root.walkDecls(node => {
        if (!node.value || (node.value.indexOf('#') < 0 && node.value.indexOf('rgb') < 0)) {
          return;
        }
        const vtree = valueParser(node.value);
        let fixed = false;
        for(let i = 0; i < vtree.nodes.length; i++) {
          const vn = vtree.nodes[i];
          if (!vn.value) continue;
          else if (vn.type === 'word' && vn.value.startsWith('#')) {
            const name = palleteMap.white[vn.value.toLowerCase()] || palleteMap.black[vn.value.toLowerCase()];
            if (!name) {
              return report(node, vn.value);
            } else {
              if (context.fix) {
                // node.value = name;
                vn.value = name;
                fixed = true;              
              }
              // break;
            }
          } else if (vn.type === 'function' && (vn.value === 'rgb' || vn.value === 'rgba')) {
            return report(node, node.value);
          }
        }

        if (fixed) {
          node.value = vtree.nodes.map(v => v.value).join('');
        }
      });

      function report(decl, v) {
        stylelint.utils.report({
          ruleName,
          result,
          node: decl,
          message: messages.rejected(v)
        });
      }
    };
  }
);

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;