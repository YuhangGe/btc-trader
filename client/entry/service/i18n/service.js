
const dict = window.__AppBootInfo.locale;

export function t(msg, params) {
  let txt = dict[msg] || msg;
  if (params !== null && typeof params === 'object') {
    txt = txt.replace(/\{\s*([\w\d.]+)\s*\}/g, function(m, n) {
      // 因为支持 { a.b.c } 这样的写法，所以直接构造 eval 函数获取。
      if (n.indexOf('.') >= 0) {
        return (new Function(`return obj.${n}`, 'obj'))(params);        
      } else {
        return params[n];
      }
    });
  }
  return txt;
}

export function ns(prefix) {
  return function(msg, params) {
    return t(prefix + '.' + msg, params);
  };
}

export function has(key) {
  return dict.hasOwnProperty(key);
}
