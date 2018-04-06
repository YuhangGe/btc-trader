const config = require('../config');
const MockServer = require('../../mock_server/index');

let mServer = null;

function init(cfg) {
  mServer = new MockServer(cfg);
  mServer.initialize().catch(err => {
    console.error(err);
    process.exit(0);
  });
}

init(config.mock);    

async function mock(request, response) {
  if (!config.mock.enable) return false;
  return await mServer.handle(request, response);
}

mock.reload = function() {
  console.log('mock reload.');
  init(config.mock);
};

module.exports = mock;
