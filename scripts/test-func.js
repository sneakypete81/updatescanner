console.log('Running functional tests...');

const Jasmine = require('jasmine');
const jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'test',
  spec_files: ['functional/*_spec.js'],
  random: false,
});

console.log(__dirname);

jasmine.execute();
