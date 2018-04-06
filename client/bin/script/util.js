'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const crypto = require('crypto');

const DEBUG_IF_REGEXP = /<!--\s+if\s+debug\s+-->([\d\D]+?)<!--\s+else\s+-->([\d\D]+?)<!--\s+end\s+if\s+-->/ig;

function wrapFnPromise(fn, ctx = null) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push(function(err, ...rtn) {
        if (err) {
          reject(err);
        } else {
          resolve(...rtn);
        }
      });
      fn.call(ctx || this, ...args);
    });
  };
}

const exists = function (file) {
  return new Promise((resolve) => {
    fs.access(file, err => {
      resolve(err ? false : true);
    });
  });
};


function mkdir(dir, loop = false) {
  return new Promise((resolve, reject) => {
    exists(dir).then(exist => {
      if (exist) {
        resolve();
      } else {
        if (loop) {
          const pDir = path.dirname(dir);
          mkdir(pDir, true).then(() => {
            fs.mkdir(dir, err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }, reject);
        } else {
          fs.mkdir(dir, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      }
    });
  });
}

function copy(source, target) {
  return new Promise(function(resolve, reject) {
    const rd = fs.createReadStream(source);
    rd.on('error', reject);
    const wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}

function escapeHtml(string) {
  return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
    // Escape all characters not included in SingleStringCharacters and
    // DoubleStringCharacters on
    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
    switch (character) {
    case '"':
    case '\'':
    case '\\':
      return '\\' + character;
      // Four possible LineTerminator characters need to be escaped:
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\u2028':
      return '\\u2028';
    case '\u2029':
      return '\\u2029';
    }
  });
}

function execCommand(...args) {
  return new Promise((resolve, reject)=> {
    exec(...args, (err, stdout, stderr) => {
      if (err) {
        reject(err.message);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout.toString() || '');
      }
    });
  });
}

const readFile = wrapFnPromise(fs.readFile);

async function calcFileHash(file, tryReadFile = true) {
  let cnt = file;
  if (tryReadFile === true && typeof file === 'string' && file.indexOf('\n') < 0 && /\.[a-z0-9]+$/i.test(file)) {
    cnt = await readFile(file);
  }
  const hash = crypto.createHash('md5');
  hash.update(cnt);
  return hash.digest('hex');
}

async function getGitHash() {
  const output = await execCommand('git log -n 1');
  const m = output.match(/commit\s+([a-f0-9]+)/);
  return m[1];
}

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

const FULL_URL_PREFIX = /^http(?:s)?:\/\//;
function joinUrl(...urls) {
  if (Array.isArray(urls[0])) urls = urls[0];
  let httpPrefix = '';
  urls[0] = urls[0].replace(FULL_URL_PREFIX, m => {
    httpPrefix = m;
    return '';
  });
  return httpPrefix + urls.join('/').replace(/\/+/g, '/');
}

function cloneRegEx(re) {
  const flags = [];
  if (re.global) flags.push('g');
  if (re.ignoreCase) flags.push('i');
  if (re.multiline) flags.push('m');
  return new RegExp(re.source, flags.join(''));
}

function deepClone(obj) {
  if (Array.isArray(obj)) {
    return obj.map(it => deepClone(it));
  } else if (obj instanceof RegExp) {
    return cloneRegEx(obj);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for(const k in obj) {
      newObj[k] = deepClone(obj[k]);
    }
    return newObj;
  } else {
    return obj;
  }
}

function mkdirSync(fulldir) {
  try {
    fs.accessSync(fulldir);
  } catch(ex) {
    try {
      fs.mkdirSync(fulldir);
    } catch(ex) {
      console.error('mkdirSync failed');
      console.error(ex);
    }
  }
}

/**
 * 递归新建目录
 * @param {*} paths 目录数组，如果数组元素是数组，则递归。
 * @param {*} parent 父目录
 * @example walkMkdirSync([
 *   'aaa',
 *   ['bbb', [
 *     'ccc',
 *     ['ddd', 'eee'],
 *     ['fff', ['ggg', 'hhh']]
 *   ]]
 * ])
 */
function walkMkdirSync(paths, parent = null) {
  if (parent) mkdirSync(parent);
  if (!paths) return;
  if (typeof paths === 'string') {
    return mkdirSync(path.join(parent || '', paths));
  }
  if (paths.length === 0) return;
  for(let i = 0; i < paths.length; i++) {
    const sp = paths[i];
    if (Array.isArray(sp)) {
      walkMkdirSync(sp[1], path.join(parent ? parent : '', sp[0]));
    } else {
      walkMkdirSync(null, path.join(parent || '', sp));
    }
  }
}

module.exports = {
  DEBUG_IF_REGEXP,
  exec: execCommand,
  wrapFnPromise,
  exists,
  mkdir,
  mkdirSync,
  walkMkdirSync,
  copy,
  escapeHtml,
  sleep,
  joinUrl,
  stat: wrapFnPromise(fs.stat),
  readdir: wrapFnPromise(fs.readdir),
  readFile,
  writeFile: wrapFnPromise(fs.writeFile),
  unlink: wrapFnPromise(fs.unlink),
  rmdir: wrapFnPromise(fs.rmdir),
  calcFileHash,
  getGitHash,
  deepClone
};
