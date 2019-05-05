require('./clean');
require('./copy-dependencies');

console.log('Running functional tests...');
console.log(' (ensure geckodriver is running)');

require('./lib/wdio').run();
