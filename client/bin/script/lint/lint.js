const config = require('../config');
const path = require('path');
const EsLintCLIEngine = require('eslint').CLIEngine;
const StyleLintEngine = require('stylelint');

function eslint() {
  console.log('eslint is running...');
  const cli = new EsLintCLIEngine({
    fix: true,
    ignorePath: path.join(config.root, '.eslintignore')
  });
  const report = cli.executeOnFiles([ config.root ]);
  if (report.errorCount === 0) {
    return console.log('eslint passed.\n');
  } else {
    const formatter = cli.getFormatter();
    console.error(formatter(report.results));
    process.exit(-1);
  }
}
function stylelint() {
  console.log('stylelint is running...');
  StyleLintEngine.lint({
    fix: true,
    syntax: 'less',
    formatter: 'string',
    configBasedir: path.join(config.root, 'node_modules'),
    ignorePath: path.join(config.root, '.stylelintignore'),
    files: [ path.join(config.root, 'src/**/*.less') ]
  }).then(data => {
    if (data.errored) {
      console.error(data.output);
      process.exit(-1);
    } else {
      console.log('stylelint passed.\n');
    }
  }, err => {
    console.error(err);
    process.exit(-1);
  });
}
module.exports = async function lint() {
  await eslint();
  await stylelint();
};
