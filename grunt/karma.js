const isWindows = /^win/.test(process.platform);

module.exports = {
  options: {
    configFile: 'karma.conf.js',
  },
  unit: {},
  watch: {
    singleRun: false,
    autoWatch: true,
    // Windows is not supported by the notification reporter
    reporters: ['dots', 'kjhtml'].concat(
      isWindows ? [''] : ['notification']),
    preprocessors: {}, // Don't run coverage
  },
};
