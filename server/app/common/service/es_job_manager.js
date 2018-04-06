class Job {
  constructor(id) {
    this.id = id;
    this.updateTime = Date.now();
    this._state = 'run'; // run, finish, error
    this._total = 0;
    this._current = 0;
    this._data = null;
    this._error = null;
  }
  get state() {
    return this._state;
  }
  set state(val) {
    this._state = val;
    this.updateTime = Date.now();
  }
  get error() {
    return this._error;
  }
  set error(err) {
    this._error = err;
    this.state = 'error';
  }
  get data() {
    return this._data;
  }
  set data(data) {
    this._data = data;
    this.state = 'finish';
  }
  get current() {
    return this._current;
  }
  set current(val) {
    this._current = val;
    this.updateTime = Date.now();
  }
  get total() {
    return this._total;
  }
  set total(val) {
    this._total = val;
    this.updateTime = Date.now();
  }
}

class JobManager {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
    this.jobTimeout = 30 * 1000;           // job 结束后继续保存的时间为 30 秒
    this.jobRunTimeout = 120 * 1000;       // job 执行过程中超时时间为 120 秒
    this._checkTimeoutInterval = 5 * 1000; // 5 秒检测一次
    this._aid = 0;
    this._checkTimeoutHandler = this._checkTimeout.bind(this);
    this._cTM = null;
  }
  _checkTimeout() {
    if (this.jobs.size === 0) return;
    this.jobs.forEach(job => {
      const T = job.state === 'run' ? this.jobRunTimeout : this.jobTimeout;
      if ((Date.now() - job.updateTime) > T) {
        if (job.state === 'run') {
          job.state = 'stop';
        }
        this.jobs.delete(job.id);
      }
    });
    if (this.jobs.size > 0) {
      this._cTM = setTimeout(this._checkTimeoutHandler, this._checkTimeoutInterval);
    }
  }
  createJob() {
    const job = new Job(`${this.name}____${(this._aid++).toString(36)}`);
    this.jobs.set(job.id, job);
    if (!this._cTM) {
      this._cTM = setTimeout(this._checkTimeoutHandler, this._checkTimeoutInterval);
    }
    return job;
  }
  has(jobId) {
    return this.jobs.has(jobId);
  }
  remove(job) {
    this.jobs.delete(job.id);
    if (this.jobs.size === 0 && this._cTM) {
      clearTimeout(this._cTM);
    }
  }
  get(jobId) {
    return this.jobs.get(jobId);
  }
}

module.exports = JobManager;
