module.exports = {
  options: {
    configFile: 'karma.conf.js',
  },
  unit: {},
  watch: {
    singleRun: false,
    autoWatch: true,
    reporters: ['dots', 'kjhtml', 'notification'],
    preprocessors: {}, // Don't run coverage
  },
};
