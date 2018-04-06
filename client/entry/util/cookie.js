
export function getCookie(cookieName) {
  if (!document.cookie) return null;
  let reg = new RegExp("(^| )" + cookieName + "=([^;]*)(;|$)");
  let m = document.cookie.match(reg);
  if(m) {
    return decodeURIComponent(m[2]);
  } else {
    return null;
  }
}

export function setCookie(cookieName, cookieValue, options = {}) {
  let exp = null;
  if (options.expire) {
    exp = new Date(typeof options.expire === 'number' ? (Date.now() + options.expire) : options.expire);
  } else if (options.expireDays) {
    exp = new Date(Date.now() + options.expireDays * 24 * 60 * 60 * 1000);
  }
  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)}` +
    (exp ? ';expires=' + exp.toGMTString() : '');
}
