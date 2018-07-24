require('./clean');
require('./copy-dependencies');

console.log('Running tests...');

const Server = require('karma').Server;

const server = new Server({
  configFile: __dirname + '/../karma.conf.js',
});

server.start();
