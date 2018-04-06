const path = require('path');
const _util = require('../util');
const config = require('../config');

module.exports = async function () {
  const ms = [];
  const mdir = path.join(config.root, 'module');
  const dirs = await _util.readdir(mdir);
  for(let i = 0; i < dirs.length; i++) {
    try {
      const moduleId = dirs[i];
      let st = await _util.stat(path.join(mdir, moduleId));
      if (!st.isDirectory()) continue;
      st = await _util.stat(path.join(mdir, moduleId, 'index.js'));
      if (!st.isFile()) continue;
      const code = `
import ${moduleId}Module from '${path.join(mdir, moduleId, 'index.js').replace(/\\/g, '/')}';
${moduleId}Module.id = '${moduleId}';
importedModules.push(${moduleId}Module);`;
      moduleId === 'global' ? ms.unshift(code) : ms.push(code);
    } catch(ex) {
      // continue
      console.log('Ignore module dir', dirs[i], 'as error:', ex.message);
    }
  }
  return `
const importedModules = [];
${ms.join('\n')}
export default importedModules;
`;
};
