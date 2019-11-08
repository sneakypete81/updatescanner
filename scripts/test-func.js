require('./clean');
require('./copy-dependencies');

const geckodriver = require('geckodriver');
const childProcess = require('child_process');
const path = require('path');

const FUNC_TEST_PATH = path.join(__dirname, '..', 'test', 'functional');

const test = async function() {
  console.log('Starting Geckodriver...');
  geckodriver.start();

  console.log('Running functional tests...');

  try {
    childProcess.execFileSync(
      'poetry', ['run', 'pytest'],
      {cwd: FUNC_TEST_PATH, stdio: 'inherit'},
    );
  } finally {
    console.log('Stopping Geckodriver...');
    geckodriver.stop();
  }
};

test();
