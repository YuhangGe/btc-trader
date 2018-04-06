const {
  BaseModel
} = require(__framework);

const COLUMN_DEFINES = {
  id: 'id',
  ta: {
    type: 'string',
    default: 'a'
  },
  tb: {
    type: 'string',
    length: 512,
    default: () => Math.random().toFixed(2)
  },
  createTime: {
    type: 'time',
    create: true
  },
  updateTime: {
    type: 'time',
    update: true
  }
};

class Test extends BaseModel {
  static get columnDefines() {
    return COLUMN_DEFINES;
  }
}

module.exports = Test;
