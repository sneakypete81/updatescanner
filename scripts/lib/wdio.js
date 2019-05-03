exports.run = function(options={}) {
  const Launcher = require('@wdio/cli').default;
  const wdio = new Launcher(
    __dirname + '/../../test/functional/wdio.conf.js', {});

  wdio.run().then(() => {
    process.exit();
  }, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace);
    process.exit(1);
  });
};
