import isString from 'lodash-es/isString';
import isObject from 'lodash-es/isObject';

export function $css(element, cssName, cssValue) {
  if (isString(element)) {
    element = document.querySelector(element);
  }
  if (isObject(cssName)) {
    for(const cn in cssName) {
      $css(element, cn, cssName[cn]);
    }
  } else {
    element.style[cssName] = cssValue;
  }
}

export function calcOffsetPosition($ele) {
  if (typeof $ele.length !== 'undefined') {
    $ele = $ele[0]; // jQuery element
  }
  let top = $ele.offsetTop;
  let left = $ele.offsetLeft;
  let $p = $ele;
  while(($p = $p.offsetParent)) {
    top += $p.offsetTop;
    left += $p.offsetLeft;
  }
  return {
    left: left,
    top: top
  };
}

export function calcOffsetTop($ele) {
  return calcOffsetPosition($ele).top;
}

export function calcOffsetLeft($ele) {
  return calcOffsetPosition($ele).left;
}

export function $id(id) {
  return document.getElementById(id);
}

export function $one(selector) {
  return document.querySelector(selector);
}

export function $all(selector) {
  return document.querySelectorAll(selector);
}