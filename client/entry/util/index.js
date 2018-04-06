export { EventEmitter } from './event_emitter';
export { Pagination } from './pagination';
export { browser } from './browser';
export { validators, validateField, validateForm} from './validator';
export { sha512, hashPassword, buf2hex } from './hash';
export { $css, $id, calcOffsetPosition, calcOffsetLeft, calcOffsetTop } from './dom';
export { getCookie, setCookie } from './cookie';
/*
 * 获取dpi比例, 用于适配高清屏
 * see http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 */
function getRatio() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const devicePixelRatio = window.devicePixelRatio || 2;
  const backingStoreRatio = context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1;

  window.__DPI_RATIO = devicePixelRatio / backingStoreRatio;
  return window.__DPI_RATIO;
}
export const DPIRatio = window.__DPI_RATIO || getRatio();

export function initHIDPICanvas(canvas, width, height) {
  canvas.width = width * DPIRatio;
  canvas.height = height * DPIRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  // now scale the context to counter
  // the fact that we've manually scaled
  // our canvas element
  canvas.getContext('2d').scale(DPIRatio, DPIRatio);
}

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

export function getTimestampFromId(_id) {
  return parseInt(_id.substring(0, 8), 16) * 1000;
}