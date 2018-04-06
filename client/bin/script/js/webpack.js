const path = require('path');
const uglify = require('uglify-es');
const WrapperPlugin = require('wrapper-webpack-plugin');
const _util = require('../util');
const mod = require('./mod');
const webpack = require('webpack');
const config = require('../config');
const loaderPath = path.join(config.root, 'entry/_loader');

const webpackConfig = {
  entry: '',
  mode: config.buildMode ? 'production' : 'development',
  output: {
    path: path.join(config.root, '.tmp/js')
  },
  cache: {},
  plugins: [],
  module: {
    rules: [{
      test: path.join(config.root, 'entry/boot/module.js'),
      use: {
        loader: 'string-replace-loader',
        options: {
          search: '[\\d\\D]+',
          replace: '',
          flags: 'i'
        }
      }
    }, {
      test: /\.html$/,
      use: config.buildMode ? [{
        loader: 'html-loader',
        options: {
          attrs: false,
          minimize: true
        }
      }] : 'raw-loader'
    }, {
      test: /\.jsx$/,
      use: [{
        loader: 'buble-loader',
        options: {}
      }]
    }]
  },
  externals: config.bundleExternals,
  resolve: {
    alias: config.bundleAlias,
    extensions: ['.js', '.jsx']
  },
  devtool: config.buildMode ? false : config.webpackDevtool
};
const loaderWebpackConfig = _util.deepClone(webpackConfig);
loaderWebpackConfig.entry = path.join(config.root, 'entry/_loader/index.js');

const moduleWebpackConfig = _util.deepClone(webpackConfig);
moduleWebpackConfig.entry = path.join(config.root, 'entry/boot/main.js');

async function compile(config, outputName) {
  config.output.filename = outputName + '.js';
  console.log('Start webpack packing', outputName, '...');
  
  await new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err);
      const info = stats.toJson();
      if (stats.hasErrors()) {
        reject(stats.compilation.errors);
      }
      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }
      resolve();
    });
  });
  if (!config.buildMode) {
    console.log('Generate JS', config.output.filename.green);
    return 'js/' + outputName + '.js';
  }

  let gCode = await _util.readFile(config.file, 'utf-8');
  if (!config.noCompress) {
    console.log('Start uglify compressing...');
    const result = uglify.minify(gCode);
    if (result.error) {
      console.log('Uglify error:'.red);
      console.log(result.error);
    } else {
      gCode = result.code;
      console.log('Uglify finish.');
    }
  }

  const outFile = `${outputName}.${config.buildHash}.min.js`;
  await _util.writeFile(path.join(config.root, 'dist', 'js', outFile), gCode);
  console.log('Generate JS', outFile.green);
  return 'js/' + outFile;
}

const files = { main: null, loader: null };
module.exports = async function bundle(changedFile = null) {
  
  if (!changedFile || changedFile.startsWith(loaderPath)) {
    files.loader = await compile(loaderWebpackConfig, `${config.pkgName}-loader`);
  }
  if (!changedFile || !changedFile.startsWith(loaderPath)) {
    const intro = await _util.readFile(path.join(config.root, 'entry/boot/_intro.js'), 'utf-8');
    const code = await mod();
    moduleWebpackConfig.module.rules[0].use.options.replace = code;
    // await _util.writeFile(moduleWebpackConfig.entry, code);
    moduleWebpackConfig.plugins[0] = new WrapperPlugin({
      header: `(function() {\n${intro}\n`,
      footer: '\n})();\n'
    });
    files.main = await compile(moduleWebpackConfig, config.pkgName);
  }
  return files;
};
