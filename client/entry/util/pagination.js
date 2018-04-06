import EventEmitter from './event_emitter';

const DEFAULT_OPTIONS = {
  pageSize: 20,
  maxItemCount: 7,
  shouldPageChange: () => true
};

export class Pagination extends EventEmitter {
  constructor(options = DEFAULT_OPTIONS) {
    super();
    if (typeof options === 'number') {
      options = {
        pageSize: options
      };
    }
    this.curPage = 0;
    this.totalPage = 0;
    this.totalSize = 0;
    this.pageSize = options.pageSize || DEFAULT_OPTIONS.pageSize;
    this.maxItemCount = options.maxItemCount || DEFAULT_OPTIONS.maxItemCount;
    this.items = [];
    this.shouldPageChange = options.shouldPageChange || DEFAULT_OPTIONS.shouldPageChange;
    if (options.onChange) this.on('change', options.onChange);
  }
  reset() {
    this.curPage = 0;
    this.totalPage = 0;
    this.totalSize = 0;
    this.items.length = 0;
    this.emit('reset');
  }
  _changePage(page) {
    this.curPage = page;
    this.emit('change', this.curPage);
    return true;
  }
  first() {
    if (!this.shouldPageChange() || this.curPage === 0) {
      return false;
    }
    return this._changePage(0);
  }
  last() {
    if (!this.shouldPageChange() || this.curPage === this.totalPage - 1) {
      return false;
    }
    return this._changePage(this.totalPage - 1);
  }
  next() {
    if (this.shouldPageChange() && this.curPage < this.totalPage - 1) {
      return this._changePage(this.curPage + 1);
    } else {
      return false;
    }
  }
  jump(pageIndex) {
    if (!this.shouldPageChange()
      || pageIndex === this.curPage
      || pageIndex < 0
      || pageIndex > this.totalPage -1) {
      return false;
    }
    return this._changePage(pageIndex);
  }
  prev() {
    if (this.shouldPageChange() && this.curPage > 0) {
      return this._changePage(this.curPage - 1);
    } else {
      return false;
    }
  }
  update(pag) {
    this.totalSize = pag.totalSize;
    this.totalPage = Math.ceil(this.totalSize / this.pageSize);
    const count = Math.min(this.maxItemCount, this.totalPage);
    const half = Math.floor(count / 2);
    let start = Math.max(0, this.curPage - half);
    if (start + count > this.totalPage - 1) {
      start = this.totalPage - count;
    }
    this.items.length = count;
    for(let i = 0; i < count; i++) {
      this.items[i] = start + i;
    }
  }
}
