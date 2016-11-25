// Karma configuration
// Generated on Thu Nov 24 2016 11:02:43 GMT+0000 (GMT)

/* eslint-env node */

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
      // Dependencies
      'addon/dependencies/jquery/jquery.min.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'node_modules/jasmine-fixture/dist/jasmine-fixture.min.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/sinon-chrome/bundle/sinon-chrome-webextensions.min.js',
      // Source
      'addon/lib/**/*.js',

      // Test specs
      'test/unit/**/*_spec.js',

      // // Serve fixtures, but don't include them in the runner
      // {
      //   pattern: 'test/unit/fixtures/**',
      //   watched: true, served: true, included: false,
      // },
    ],

    // list of files to exclude
    exclude: [
      '/addon/lib/dev',
    ],

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
