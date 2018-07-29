console.log('Running eslint...');

const CLIEngine = require('eslint').CLIEngine;

const cli = new CLIEngine({
  ignorePattern: [
    'node_modules/',
    'coverage/',
    'build/',
    'src/dependencies',
    'test/dependencies',
  ],
  // maxWarnings: 0,

});

const report = cli.executeOnFiles(['.']);

// get the default formatter
const formatter = cli.getFormatter();

// Also could do...
// var formatter = cli.getFormatter("compact");
// var formatter = cli.getFormatter("./my/formatter.js");

// output to console
console.log(formatter(report.results));

if (report.errorCount > 0 || report.warningCount > 0) {
  process.exit(1);
}
