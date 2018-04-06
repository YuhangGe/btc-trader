import isUndefined from 'lodash-es/isUndefined';

if (typeof Object.assign === 'undefined') {
  Object.assign = function (dst, src) {
    for(const prop in src) {
      if (!isUndefined(src)) {
        dst[prop] = src[prop];
      }
    }
    return dst;
  };
}

if (typeof Object.getOwnPropertyNames === 'undefined') {
  Object.getOwnPropertyNames = function (proto) {
    const keys = [];
    for(const k in proto) {
      keys.push(k);
    }
    return keys;
  };
}

