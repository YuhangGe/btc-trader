const _util = require('../util');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const { handleLib } = require('./_min');
const distDir = path.join(config.root, config.buildMode ? 'dist' : '.tmp');

const LIVE_CODE = fs.readFileSync(path.join(__dirname, '_tpl.live.js'), 'utf-8');
const DEFAULT_JS_FILES = {
  loader: `js/${config.pkgName}-loader.js`,
  main: `js/${config.pkgName}.js`
};
const DEFAULT_CSS_FILES = {
  main: `css/${config.pkgName}.$\{theme}.css`
};
const DEFAULT_LOCALE_FILES = {
  main: `js/${config.pkgName}.locale.$\{locale}.js`
};

async function _write(libs, renders, ext) {
  if (renders.length === 0) return null;
  const hash = await _util.calcFileHash(libs.join(','), false);
  const fn = `${config.pkgName}.render.${hash}${ext}`;
  const fullpath = path.join(distDir, ext.substring(1), fn);
  if (!(await _util.exists(fullpath))) {
    await _util.writeFile(fullpath, '/*\n' + libs.join('\n') + '\n*/\n' + renders.join('\n\n'));
    console.log('Merged lib', libs.map(l => `\n\t${l.green}`).join('') + '\n\tto ' + fn.green);
  }
  return path.join(ext.substring(1), fn);
}

async function generate(cssFiles = DEFAULT_CSS_FILES, jsFiles = DEFAULT_JS_FILES, localeFiles = DEFAULT_LOCALE_FILES) {
  let html = await _util.readFile(path.join(config.root, 'entry/index.htm'), 'utf-8');
  if (!config.buildMode) {
    const idx = html.indexOf('<head>');
    html = html.substring(0, idx + 6) + '\n<script>\n' + LIVE_CODE + '\n</script>\n' + html.substring(idx + 6);
  }
  
  const jsLibs = [];
  const jsLibRenders = [];
  const cssLibs = [];
  const cssLibRenders = [];
  (await Promise.all(config.libs.map(lib => handleLib(lib)))).forEach(result => {
    const [fn, cnt] =  result;
    if (fn.endsWith('.js')) {
      jsLibs.push(fn);
      jsLibRenders.push(cnt);
    } else {
      cssLibs.push(fn);
      cssLibRenders.push(cnt);
    }
  });

  const result = await Promise.all([
    _write(jsLibs, jsLibRenders, '.js'),
    _write(cssLibs, cssLibRenders, '.css')
  ]);

  const cssRenders = result[1] ? [ result[1] ] : [];
  const jsRenders = result[0] ? [ result[0] ] : [];
  /* 此处所有文件都包到数组里，是为了加载多个文件做铺垫 */
  const locales = [localeFiles.main];
  const scripts = [jsFiles.main];
  const themes = [cssFiles.main];
  html = html.replace('env: {}', () => {
    return `env: ${JSON.stringify(config.env)}`;
  }).replace('files: {}', () => {
    return `files: {
      locales: ${JSON.stringify(locales)},
      themes: ${JSON.stringify(themes)},
      scripts: ${JSON.stringify(scripts)}
    }`;
  }).replace(/<\/body>\s*<\/html>\s*$/, () => {
    return `
${cssRenders.map(f => `<link rel="stylesheet" href="${f}"/>`).join('\n  ')}
${jsRenders.map(f => `<script src="${f}"></script>`).join('\n  ')}
<script src="${jsFiles.loader}"></script>
</body>
</html>`;
  });
  await _util.writeFile(path.join(distDir, 'index.html'), html);
  console.log('Generate', 'index.html'.green);

}

module.exports = generate;
