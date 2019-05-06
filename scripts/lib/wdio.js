exports.run = async function() {
  const Launcher = require('@wdio/cli').default;
  const wdio = new Launcher(
    __dirname + '/../../test/functional/wdio.conf.js', {});

  return await wdio.run();
};
