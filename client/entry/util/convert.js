export function padNumber(n, padLength = 2, padChar = '0') {
  let str = n.toString();
  if (str.length >= padLength) {
    return str;
  }
  for(let i = str.length; i < padLength; i++) {
    str = padChar + str;
  }
  return str;
}

export function convertTime(tm) {
  if (tm instanceof Date) return tm;
  if (typeof tm === 'string' && /^\d+$/.test(tm)) return new Date(Number(tm));
  return new Date(tm);
}

export function getTimestampFromId(_id) {
  return parseInt(_id.substring(0, 8), 16) * 1000;
}