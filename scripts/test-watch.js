require('./clean');
require('./copy-dependencies');

console.log('Running tests...');

const isWindows = /^win/.test(process.platform);

require('./lib/karma').run({
  singleRun: false,
  autoWatch: true,
  // Windows is not supported by the notification reporter
  reporters: ['dots', 'kjhtml'].concat(
    isWindows ? [] : ['notification']),
});
