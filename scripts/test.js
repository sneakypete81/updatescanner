require('./clean');
require('./copy-dependencies');

console.log('Running tests...');

require('./lib/karma').run();
