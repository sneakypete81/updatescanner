exports.run = function(options={}) {
  options.configFile = __dirname + '/../../karma.conf.js';

  const Server = require('karma').Server;
  const server = new Server(options);
  server.start();
};
