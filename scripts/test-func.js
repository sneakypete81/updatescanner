require('./clean');
require('./copy-dependencies');

const geckodriver = require('geckodriver');

const test = async function() {
  console.log('Starting Geckodriver...');
  geckodriver.start();

  console.log('Running functional tests...');

  try {
    await require('./lib/wdio').run();
  } finally {
    console.log('Stopping Geckodriver...');
    geckodriver.stop();
  }
  process.exit();
};

test();
