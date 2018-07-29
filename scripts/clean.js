console.log('Cleaning dependencies...');
const rimraf = require('rimraf');

rimraf.sync('src/dependencies');
rimraf.sync('test/dependencies');
