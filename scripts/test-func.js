const Jasmine = require('jasmine');
const jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'test',
  spec_files: ['functional/*_spec.js'],
  random: false,
});

const JasmineConsoleReporter = require('jasmine-console-reporter');
const reporter = new JasmineConsoleReporter({
});
jasmine.env.clearReporters();
jasmine.addReporter(reporter);

jasmine.execute();
