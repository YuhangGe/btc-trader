import locales from './locales';
import env from '../boot/env';

if (!env.SUPPORT_LANGUAGES) env.SUPPORT_LANGUAGES = locales;

const SUPPORT_LANGUAGES = env.SUPPORT_LANGUAGES;
const DEFAULT_LANGUAGE = env.DEFAULT_LANGUAGE || 'zh_cn';

export function getLocale(userInfo) {
  const locale = (
    userInfo.locale || localStorage.getItem('LOCALE') ||
    navigator.language || DEFAULT_LANGUAGE
  ).toLowerCase().replace(/-/g, '_');
  for (let i = 0; i < SUPPORT_LANGUAGES.length; i++) {
    const lang = SUPPORT_LANGUAGES[i];
    if (lang.locale === locale) {
      return lang.locale;
    }
    const matches = lang.matches;
    if (matches && findIndex(matches, lo => (lo instanceof RegExp) ? lo.test(locale) : lo === locale) >= 0) {
      return lang.locale;
    }
  }
  return DEFAULT_LANGUAGE;
}

export function findIndex(arr, fn) {
  for(let i = 0; i < arr.length; i++) {
    if (fn(arr[i])) return i;
  }
  return -1;
}

export function joinUrl(...segs) {
  return segs.join('/').replace(/\/+/g, '/');
}

export function loadStyle(href) {
  return new Promise((resolve, reject) => {
    const $link = document.createElement('link');
    document.body.appendChild($link);
    $link.setAttribute('rel', 'stylesheet');
    $link.setAttribute('href', href);
    $link.onload = resolve;
    $link.onerror = reject;
  });
}

export function loadLocale(file) {
  return window.fetch(joinUrl(env.URL_ASSET_ROOT, file)).then(res => res.text()).then(cnt => {
    const dict = (new Function(cnt))();
    const src = window.__AppBootInfo.locale;
    for(const k in dict) {
      if (src.hasOwnProperty(k)) {
        logger.warn('多语言字典冲突：', k, file);
      }
      src[k] = dict[k];
    }
  });
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const $s = document.createElement('script');
    document.body.appendChild($s);    
    $s.src = src;
    $s.async = false;
    $s.onload = resolve;
    $s.onerror = reject;
  });
}