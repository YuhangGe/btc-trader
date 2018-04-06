const _util = require('../util');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const TYPES = {
  '.ico': 'image/x-icon',
  '.icon': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.jpg': 'image/jpg',
  '.bmp': 'image/bmp',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};


module.exports = function serveStatic(paths) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  paths = paths.map(p => path.resolve(config.root, p));
  return async function (request, response) {
    let url = request.url;
    if (url.indexOf('?') >= 0) url = url.replace(/\?.+$/, ''); // ignore query
    if (url.startsWith('/__public/')) {
      url = url.substring(9);
    }
    let file = null;
    let stat = null;
    for(let i = 0; i < paths.length; i++) {
      stat = null;
      file = null;
      const trying = true;
      while(trying) {
        try {
          file = path.join(paths[i], url);
          stat = await _util.stat(file);
        } catch(ex) {
          if (['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'].indexOf(ex.code) < 0) {
            throw ex;
          }
          stat = null;
          file = null;
          break;
        }
        if (stat && stat.isDirectory()) {
          url = path.join(url, 'index.html');
        } else {
          break;
        }
      }
      if (stat && stat.isFile()) {
        break;
      }
    }
    if (!stat) {
      return false;
    }
    
    const mt = request.headers['if-modified-since'];
    if (mt && mt === stat.mtime.toUTCString()) {
      response.writeHead(304);
      response.end();
      return true;
    }
    
    response.setHeader('Last-Modified', stat.mtime.toUTCString());
    response.setHeader('Content-Length', stat.size);
    response.setHeader('Cache-Control', 'max-age=0');
    response.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
    return true;
  };
};
