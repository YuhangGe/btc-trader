
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

  return devicePixelRatio / backingStoreRatio;
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