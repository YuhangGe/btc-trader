export class EventEmitter {
  constructor() {
    this.__listeners = new Map();
  }
  on(eventName, handler) {
    if (!this.__listeners.has(eventName)) {
      this.__listeners.set(eventName, []);
    }
    const arr = this.__listeners.get(eventName);
    if (arr.indexOf(handler) < 0) {
      arr.push(handler);
    }
  }
  off(eventName, handler) {
    if (!this.__listeners.has(eventName)) return;
    const arr = this.__listeners.get(eventName);
    const idx = arr.indexOf(handler) < 0;
    if (idx >= 0) {
      arr.splice(idx, 1);
    }
  }
  removeListener(eventName, handler) {
    this.off(eventName, handler);
  }
  removeAllListeners(eventName) {
    if (!eventName) {
      this.__listeners.forEach(listeners => {
        listeners.length = 0;
      });
    } else if (this.__listeners.has(eventName)) {
      this.__listeners.get(eventName).length = 0;
    }
  }
  emit(eventName, ...args) {
    if (!this.__listeners.has(eventName)) return;
    const arr = this.__listeners.get(eventName);
    if (!arr || arr.length === 0) return;
    arr.forEach(handler => handler(...args));
  }
}

// export to window
if (typeof window.EventEmitter === 'undefined') {
  window.EventEmitter = EventEmitter;
}
export default EventEmitter;
