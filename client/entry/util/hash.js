export function sha512(str, hex = true) {
  const buf = new Uint8Array(str.length);
  for(let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i) & 0xff;
  }
  return _sha512(buf).then(out => hex ? toHex(out) : out);
}

function _hex16(x) {
  return x > 15 ? x.toString(16) : '0' + x.toString(16);
}
export function toHex(buffer) {
  return Array.prototype.map.call(
    buffer instanceof ArrayBuffer 
      ? new Uint8Array(buffer) 
      : buffer,
    x => _hex16(x)
  ).join('');
}

export const buf2hex = toHex;

function _sha512(buf) {
  return new Promise((resolve, reject) => {
    if (!window.crypto || !(window.crypto.subtle || window.crypto.webkitSubtle)) {
      console.error('crypto not support');
      return reject('crypto not support');
    }
    const subtle = window.crypto.subtle || window.crypto.webkitSubtle;
    try {
      subtle.digest('SHA-512', buf).then(resolve, err => {
        // resolve(asmCrypto.SHA512.bytes(buf));
        console.error(err);
        return reject('crypto not support');
      });
    } catch(ex) {
      // return resolve(asmCrypto.SHA512.bytes(buf));
      console.error(ex);
      return reject(ex);
    }
  });
}

export function hashPassword(password) {
  let n = 0;
  const arr = password.split('').map(c => {
    const k = c.charCodeAt(0) & 0xff;
    n += k;
    return k;
  });
  const buf = new Uint8Array(arr.length);
  const start = n % password.length;
  for(let i = 0; i < arr.length; i++) {
    buf[i] = arr[(start + i) % password.length];
  }

  return _sha512(buf).then(out => {
    const ob = new Uint8Array(out);
    const hex = toHex(ob);
    if (hex.length <= 64) return hex;
    const idx = ob[0] % hex.length;
    const idx2 = idx + 64;
    return hex.substring(idx, idx2) + (idx2 > hex.length ? hex.substring(0, idx2 - hex.length) : '');
  });

}