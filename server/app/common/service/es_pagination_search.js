const _ = require('lodash');
const JobManager = require('./es_job_manager');

const jobManager = new JobManager('__es_pagination_search__');

async function search(esInfo, options) {
  const cfg = this.config.elastic;
  let from = _.isNumber(options.from) ? options.from : 0;
  const size = _.isNumber(options.size) ? options.size : 10;
  if (from < 0) from = 0;
  const sort = esInfo.sort ? esInfo.sort : ['_doc'];
  if (from + size <= cfg.windowSize) {
    const data =  { sort };
    if (esInfo.query) {
      data.query = esInfo.query;
    }
    if (esInfo.source) {
      data._source = esInfo.source;
    }
    if (esInfo.highlight) {
      data.highlight = esInfo.highlight;
    }
    const result = await this.elastic.search({
      index: esInfo.index,
      type: esInfo.type,
      ignoreUnavailable: true,
      size,
      from,
      body: data
    });
    if (!result.hits || !result.hits.hits) {
      return { error: result };
    }
    return {
      error: null,
      async: false,
      data: result
    };
  }
  const scrollIdsToClear = [];
  let WINDOW_SIZE = cfg.windowSize;
  const e = from + size;
  if (e > 5000000) {
    WINDOW_SIZE = 500000;
  } else if (e > 1000000) {
    WINDOW_SIZE = 100000;
  } else if (e > 500000) {
    WINDOW_SIZE = 50000;
  }

  // from = 5;
  // size = 3;
  // WINDOW_SIZE = 2;

  const skipLoopCount = Math.ceil((from + size) / WINDOW_SIZE);
  let scrollId = null;
  let pos = 0;
  let state = -1;
  const idArray = [];
  let totalSize = 0;
  const job = jobManager.createJob();
  job.total = skipLoopCount;

  let i = 0;

  const runJob = () => {
    if (job.state === 'stop') {
      return clearScrollIdsArray();
    }

    let fp;
    if (!scrollId) {
      const body = {
        sort,
        _source: false
      };
      if (esInfo.query) body.query = esInfo.query;
      fp = this.elastic.search({
        size: WINDOW_SIZE,
        index: esInfo.index,
        type: esInfo.type,
        ignoreUnavailable: true,
        scroll: cfg.scrollTimeout,
        body
      });
    } else {
      fp = this.elastic.scroll({
        scroll: cfg.scrollTimeout,
        scrollId
      });
    }
    fp.then(result => {
      if (job.state === 'stop') {
        return clearScrollIdsArray.call(this);
      }

      if (!result.hits || !result.hits.hits || !result._scroll_id) {
        job.error = result;
        return clearScrollIdsArray.call(this);
      }

      if (!scrollId) {
        totalSize = result.hits.total;
      }
      const cp = pos + result.hits.hits.length;
      let ia = -1;
      let ib = -1;
      if (state < 0) {
        if (cp > from) {
          ia = from - pos;
          state = 0;
        }
      } else {
        ia = 0;
      }

      if (state === 0) {
        ib = from + size - pos;
        if (cp >= from + size) {
          state = 1;
        }
      }

      if (ia >= 0 && ib >= 0) {
        Array.prototype.push.apply(idArray, result.hits.hits.slice(ia, ib).map(hit => {
          return hit._id;
        }));
      }
      pos = cp;
      scrollId = result._scroll_id;
      scrollIdsToClear.push(scrollId);
      job.current++;
      i++;
      if (i >= skipLoopCount || state === 1 || result.hits.hits.length < WINDOW_SIZE) {
        setTimeout(() => {
          searchByIds.call(this);
        }, 0);
      } else {
        setTimeout(() => {
          runJob.call(this);
        });
      }
    }, err => {
      clearScrollIdsArray.call(this);
      job.error = err;
    });

  };

  const searchByIds = () => {
    if (job.state === 'stop') {
      return clearScrollIdsArray.call(this);
    }


    job.current = job.total - 1;

    const data = {
      query: {
        terms: {
          _id: idArray
        }
      }
    };
    if (esInfo.source) {
      data._source = esInfo.source;
    }
    if (esInfo.highlight) {
      data.highlight = esInfo.highlight;
    }
    this.elastic.search({
      index: esInfo.index,
      type: esInfo.type,
      ignoreUnavailable: true,
      body: data
    }).then(result => {

      clearScrollIdsArray.call(this);

      if (job.state === 'stop') {
        return;
      }

      if (!result.hits || !result.hits.hits) {
        job.error = result;
        return;
      }
      const sortCache = {};
      result.hits.hits.forEach(hit => {
        sortCache[hit._id] = hit;
      });
      // console.log(idArray);
      // console.log(result.hits.hits.map(h => h._id));
      // todo 这里 idArray 和 result.hits.hits 里面的内容有可能不对应，需要排查
      job.current = job.total;
      job.data = {
        hits: {
          // filter 是为了临时解决 bug 让不报错
          hits: idArray.map(id => sortCache[id]).filter(hit => !!hit),
          total: totalSize
        }
      };
    }, err => {
      clearScrollIdsArray.call(this);
      job.error = err;
    });
  };

  const clearScrollIdsArray = () => {
    if (scrollIdsToClear.length === 0) return;
    // as scroll ids will be auto clear after timeout
    // so we do not care this action fail
    this.elastic.clearScroll({
      scrollId: scrollIdsToClear
    }).catch(err => {
      this.logger.debug(err);
    });
    scrollIdsToClear.length = 0;
  };

  runJob.call(this);

  return {
    async: true,
    jobId: job.id
  };

}

async function getJobInfo(jobId) {
  if (!jobManager.has(jobId)) {
    return { error: 'not_found' };
  }
  const job = jobManager.get(jobId);
  console.log(job.data);
  return job.error ? { error: job.error } : {
    id: job.id,
    state: job.state,
    current: job.current,
    total:job.total,
    data: job.data
  };
}

async function stopJob(jobId) {
  if (!jobManager.has(jobId)) {
    return true;
  }
  const job = jobManager.get(jobId);
  job.state = 'stop';
  jobManager.remove(job);
  return true;
}

module.exports = {
  search,
  getJobInfo,
  stopJob
};
