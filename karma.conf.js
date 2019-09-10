/* eslint-env node */

// Karma configuration
// Generated on Thu Nov 24 2016 11:02:43 GMT+0000 (GMT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    // Don't use the jasmine-jquery plugin, it's horrible.
    // Just include jasmine-jquery.js in the files below.
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      {
        pattern: 'src/dependencies/include/!(redux|webext-redux)/**/*.js',
      },

      {
        pattern: 'src/dependencies/module/**/*.js',
        type: 'module',
      },

      {
        pattern: 'src/lib/**/*.js',
        type: 'module',
      },

      {
        pattern: 'test/dependencies/**/*.js',
      },

      {
        pattern: 'test/unit/stubs/**/*.js',
      },

      {
        pattern: 'test/unit/*_spec.js',
        type: 'module',
      },

      // Serve fixtures, but don't include them in the runner
      {
        pattern: 'test/unit/fixtures/**',
        included: false,
      },
    ],

    // Fix module paths to match where Karma serves them
    proxies: {
      '/lib/': '/base/src/lib/',
      '/dependencies/': '/base/src/dependencies/',
      '/test/': '/base/test/',
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    //                  config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable/disable watching file and executing tests when any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  });
};
