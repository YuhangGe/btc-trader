
const HTTP_REG = /^http(?:s?):\/\//;
export function joinUrl(...args) {
  if (args.length === 0) return '';
  let p = '';
  args[0] = args[0].replace(HTTP_REG, m => {
    p = m;
    return '';
  });
  return p + (args.join('/').replace(/\/+/g, '/'));
}

export function appendUrlQuery(url, data) {
  const arr = [];
  for(const k in data) {
    if (data[k] === undefined) continue;
    arr.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
  }
  url += (url.indexOf('?') > 0 ? '&' : '?') + arr.join('&');
  return url;
}