const ua = navigator.userAgent;
let m;
export const browser = {
  type: 'unknown',
  version: 0,
  is: {
    edge: false,
    chrome: false,
    firefox: false,
    safari: false,
    iPhone: false,
    iPad: false,
    ios: false
  }
};

if ((m = ua.match(/edge\/(\d+)/i))) {
  browser.is.edge = true;
  browser.type = 'edge';
  browser.version = Number(m[1]);
} else if ((m = ua.match(/chrome\/(\d+)/i))) {
  browser.type = 'chrome';
  browser.version = Number(m[1]);
  browser.is.chrome = true;
} else if ((m = ua.match(/firefox\/(\d+)/i))) {
  browser.type = 'firefox';
  browser.version = Number(m[1]);
  browser.is.firefox = true;
} else if (/safari/i.test(ua) && (m = ua.match(/version\/(\d+)/i))) {
  browser.type = 'safari';
  browser.version = Number(m[1]);
  browser.is.safari = true;
}

if (/iphone/i.test(ua)) {
  browser.is.iPhone = true;
  browser.is.ios = true;
} else if (/ipad/i.test(ua)) {
  browser.is.iPad = true;
  browser.is.ios = true;
}

export default browser;
