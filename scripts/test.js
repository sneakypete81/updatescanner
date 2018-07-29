require('./clean');
require('./copy-dependencies');

console.log('Running tests...');

require('./karma').run();
