const _ = require('lodash');

const aid = (function() {
  let _id = 0;
  return function() {
    return (_id++).toString(32);
  };
})();
const uid = (function() {
  let _id = 0;
  return function() {
    if (_id >= 0xfffffff) _id = 0;
    return Date.now().toString(32) + (_id++).toString(32);
  };
})();


function parseTime(v) {
  if (!v) return new Date('not validate');
  else if (_.isString(v)) {
    return new Date(/^\d+$/.test(v) ? parseInt(v) : v);
  } else {
    return new Date(v);
  }
}


module.exports = {
  aid,
  uid,
  parseTime
};
