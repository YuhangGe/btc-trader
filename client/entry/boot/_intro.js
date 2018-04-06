/*eslint no-unused-vars: off*/

function fetch(...args) {
  return window.__$fetch(...args);
}

/**
 * AbortController polyfill
 */
const AbortController = window.AbortController || class AbortController {
  constructor() {
    this.signal = new window.EventEmitter();
  }
  abort() {
    this.signal.emit('abort');
  }
};

/**
 * 日志服务。前端代码里使用 logger 服务替换 console 日志
 * 服务，为以后服务端收集日志做铺垫。
 */
const logger = (function() {
  /*eslint no-console: off*/
  const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
  };
  const LEVEL_NAMES = ['debug', 'info', 'warn', 'error', 'none'];

  class SimpleLogger {
    constructor(level) {
      this._level = 0;
      if (level) this.level = level;
    }
    get level() {
      return LEVEL_NAMES[this._level];
    }
    set level(level) {
      if (!level || !LEVELS.hasOwnProperty(level.toLowerCase())) {
        throw new Error('Unsupport log level');
      }
      this._level = LEVELS[level.toLowerCase()];
    }
    trace() {
      console.trace();
    }
    error(...args) {
      if (LEVELS.error < this._level) return;
      console.error(...args);
    }
    debug(...args) {
      if (LEVELS.debug < this._level) return;
      console.log(...args);
    }
    log(...args) {
      this.debug(...args);
    }
    info(...args) {
      if (LEVELS.info < this._level) return;
      console.log(...args);
    }
    warn(...args) {
      if (LEVELS.warn < this._level) return;
      console.warn(...args);
    }
  }
  
  const level = (window.__AppBootInfo.env.LOG_LEVEL || 'debug').toLowerCase();
  /*
   * LOG_LEVEL 为 debug 的情况下，通常是本地开发环境。
   * 为了让开发者可以直接通过点击日志跳到对应的代码，
   * 本地开发环境时直接返回原生 console。
   * 而线上环境时返回 SimpleLogger 可以实现对 LOG_LEVEL 的控制，
   * 避免打印太多日志。
   */
  if (level === 'debug') return console;
  else return new SimpleLogger(level);
})();