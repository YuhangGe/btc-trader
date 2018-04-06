const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const passwordGenerator = require('generate-password');

function wrapPromise(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...results) => {
        if (err) return reject(err);
        resolve(...results);
      });
    });
  };
}

const readdir = wrapPromise(fs.readdir);
const stat = wrapPromise(fs.stat);
const access = wrapPromise(fs.access);
const readFile = wrapPromise(fs.readFile);

async function exists(fileOrDir) {
  try {
    await access(fileOrDir);
    return true;
  } catch(ex) {
    return false;
  }
}

async function loopRequire(dir, modules = []) {
  const files = await readdir(dir);
  for(let i = 0; i < files.length; i++) {
    const fp = path.join(dir, files[i]);
    const st = await stat(fp);
    if (st.isDirectory()) {
      await loopRequire(fp, modules);
    } else if (st.isFile() && /\.js$/.test(fp)) {
      modules.push(require(fp));      
    }
  }
  return modules;
}


function decorate(decorators, target, key, desc) {
  const c = arguments.length;
  let r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') {
    r = Reflect.decorate(decorators, target, key, desc);
  } else {
    for (var i = decorators.length - 1; i >= 0; i--) {
      const d = decorators[i];
      if (d) {
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      }
    }
  } 
  c > 3 && r && Object.defineProperty(target, key, r);
  return r;
}

function generatePassword(options) {
  return passwordGenerator.generate(Object.assign({
    length: 12,
    symbols: true,
    uppercase: true,
    numbers: true
  }, options || {}));
}

module.exports = {
  generatePassword,
  writeFile: wrapPromise(fs.writeFile),
  randomBytes: wrapPromise(crypto.randomBytes),
  decorate,
  wrapPromise,
  readFile,
  readdir,
  stat,
  access,
  exists,
  loopRequire
};
