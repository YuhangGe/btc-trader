const less = require('less');
const _util = require('../util');
const path = require('path');
const LessPluginCleanCSS = require('less-plugin-clean-css');
const ThemePlugin = require('./theme');
const config = require('../config');

const modulePath = path.join(config.root, 'module');

const palleteCode = {
  white: getPalleteCode('white'),
  black: getPalleteCode('black')
};
function getPalleteCode(theme) {
  return config.pallete.names.map(n => {
    return `${n}: ${config.pallete[theme][n]};`;
  }).join('\n') + '\n';
}
async function scanModule() {
  const lines = [];
  const dirs = await _util.readdir(modulePath);
  for(let i = 0; i < dirs.length; i++) {
    const moduleStyleFile = path.join(modulePath, dirs[i], 'style', 'index.less');
    try {
      const st = await _util.stat(moduleStyleFile);
      if (!st.isFile()) continue;
      lines.push(`@import '${moduleStyleFile}';`);
    } catch(ex) {
      if (ex.code === 'ENOENT') {
        continue;
      } else throw ex;
    }
  }
  return lines.join('\n');
}

async function _render(cnt, theme, outputName, indexDir) {
  const themePlugin = new ThemePlugin({
    theme,
    indexDir
  });
  const result = await new Promise(resolve => {
    less.render(palleteCode[theme] + cnt, {
      plugins: ((!config.buildMode || config.noCompress) ? [] : [ new LessPluginCleanCSS({ advanced: true }) ]).concat([ themePlugin ]),
      sourceMap: (!config.buildMode && !config.noCompress) ? {
        sourceMapBasepath: indexDir,
        sourceMapURL: `${outputName}.${theme}.css.map`
      } : false
    }).then(resolve, resolve);
  });
  if (!result.css) return result;
  await _write(outputName, result, theme);
  return null;
}

async function _write(outputName, result, theme) {
  if (config.buildMode) {
    outputName += `.${config.buildHash}.${theme}.min.css`;
  } else {
    outputName += `.${theme}.css`;
  }
  const dir = path.join(config.root, config.buildMode ? 'dist/css' : '.tmp/css');
  await _util.writeFile(path.join(dir, outputName), result.css);
  if ((!config.buildHash || config.noCompress) && result.map) {
    await _util.writeFile(path.join(dir, `${outputName}.map`), result.map);
  }
  console.log(`Generate CSS ${outputName.green}`);
}

async function compileContent(cnt, outputName, indexDir) {
  const errors = await Promise.all([
    _render(cnt, 'black', outputName, indexDir),
    _render(cnt, 'white', outputName, indexDir)
  ]);
  if (errors[0] && errors[1]) {
    throw errors[0];
  } else if (errors[0]) {
    console.log(`WARNING: 生成黑色主题 css 文件失败，${errors[0]}`.yellow);
  } else if (errors[1]) {
    console.log(`WARNING: 生成白色主题 css 文件失败，${errors[1]}`.yellow);
  }
  return `css/${outputName}.$\{theme}${config.buildMode ? '.' + config.buildHash : ''}.css`;
}

const files = { main: null };
module.exports = async function compile() {
  const cnt = await scanModule();
  files.main = await compileContent(cnt, config.pkgName, modulePath);
  return files;
};