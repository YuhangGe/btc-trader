const path = require('path');
const watcher = require('chokidar');
const config = require('./config');
const ip = require('ip');
const less = require('./css/less');
const html = require('./html/gen');
const locale = require('./locale/gen');
const webpack = require('./js/webpack');
const createDevServer = require('./serve/server');
const cacheFiles = [];

async function dev() {
  console.log(`pentagon develop tool running:
  package name: ${config.pkgName.green}
  ip address:   ${ip.address().green}
  `);
  const results = await Promise.all([
    less(),
    webpack(),
    locale()
  ]);
  cacheFiles.push(...results);
  await html(results[0], results[1], results[2]);
  const server = await createDevServer();

  watch(path.join(config.root, 'entry'), onSrcFileChange);
  watch(path.join(config.root, 'module'), onSrcFileChange);
  watch(path.join(config.root, '.tmp'), onTmpFileChange);
  config.mock.enable && watch(config.mock.dir, onMockFileChange);  
  
  let changeBusy = false;

  function onSrcFileChange(file) {
    if (changeBusy) return;
    (async function () {
      changeBusy = true;
      const ext = path.extname(file);
      if ('.htm' === ext) {
        await html(cacheFiles[0], cacheFiles[1], cacheFiles[2]);
      } else if ('.less' === ext) {
        await less(file);
      } else if (['.js', '.jsx'].indexOf(ext) >= 0) {
        await webpack(file);
      }
      changeBusy = false;
    })().catch(err => {
      console.log(err);
      changeBusy = false;
    });
  }

  function onTmpFileChange(file) {
    if (!/\.(js|css|html)$/.test(file)) return;
    server && server.reload();
  }

  function onMockFileChange(file) {
    if (/\.js(?:(?:on)?)$/.test(file)) {
      try {
        delete require.cache[require.resolve(file)];
      } catch(ex) {
        console.error(ex);
        return;
      }
      server.reloadMock(config.mock);
    }
  }

  function watch(dir, handler) {
    // console.log('Watching dir', path.relative(config.root, dir).green, 'for changes...');
    watcher.watch(dir, { ignoreInitial: true })
      .on('add', handler)
      .on('change', handler)
      .on('unlink', handler);
  }

}

module.exports = dev;
