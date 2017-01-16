/* eslint-env node */
const path = require('path');

module.exports = function(grunt) {
  // Load all NPM tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig();

  grunt.registerTask('default', 'Lint and build the webextension.',
                     ['build', 'lint', 'test']);

  grunt.registerTask('build', 'Build the webextension.',
                     ['clean', 'webpack:build', 'shell:webextBuild']);

  grunt.registerTask('run', 'Run the webextension with Firefox.',
                     ['clean', 'concurrent:run']);

  grunt.registerTask('lint', 'Check for linter warnings.',
                     ['eslint', 'shell:webextLint']);

  grunt.registerTask('test', 'Run the unit tests.',
                     ['env:karma', 'karma:unit']);

  grunt.registerTask('test:watch', 'Run the unit tests in watch mode.',
                     ['env:karma', 'karma:watch']);

  grunt.config('clean', {
    output: [
      'dist/',
      'build/',
      'coverage/',
    ],
  });

  // Custom environment variables for Firefox
  // Uses options.add so that these can be overridden by the environment.
  grunt.config('env', {
    karma: {options: {add: {
      FIREFOX_BIN: 'firefox-developer',
    }}},
    webextRun: {options: {add: {
      WEB_EXT_FIREFOX: 'firefox-developer',
      WEB_EXT_FIREFOX_PROFILE: 'dev-edition-default',
    }}},
  });

  // Use grunt-shell to launch web-ext
  const webExtCmd = function(command, args=[]) {
    const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext',
                          '--source-dir=build'];
    return webExtBinary.concat([command]).concat(args).join(' ');
  };

  grunt.config('shell', {
    webextBuild: {
      command: webExtCmd('build', ['--artifacts-dir=dist']),
    },
    webextRun: {
      command: webExtCmd('run'),
    },
    webextLint: {
      command: webExtCmd('lint'),
    },
  });

  const webpack = require('webpack');
  const CopyWebpackPlugin = require('copy-webpack-plugin');

  grunt.config('webpack', {
    build: {},

    watch: {
      watch: true,
    },

    options: {
      entry: {
        main: './src/lib/main/main_script.js',
        background: './src/lib/background/background_script.js',
        debug_storage: './src/lib/debug_storage/debug_storage_script.js',
      },

      output: {
        path: 'build',
        filename: 'lib/[name]/[name]_script.js',
      },

      resolve: {
        modules: [
          path.resolve(__dirname, 'src/lib'),
          'node_modules',
        ],
      },

      plugins: [
        // Since some NodeJS modules expect to be running in Node, it is helpful
        // to set this environment var to avoid reference errors.
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),

        // Copy across all non-javascript files
        new CopyWebpackPlugin([{
          context: 'src',
          from: '**/*',
        }],
        {ignore: ['*.js']}),
      ],

      // This will expose source map files so that errors will point to your
      // original source files instead of the transpiled files.
      devtool: 'inline-sourcemap',
    },
  });

  grunt.config('eslint', {
    options: {
      ignorePattern: ['node_modules/', 'coverage/', 'build/'],
      maxWarnings: 0,
    },
    target: ['.'],
  });

  grunt.config('karma', {
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
  });

  grunt.config('concurrent', {
    // Run webpack in watch mode alongside webext run
    run: {
      tasks: ['webpack:watch', ['env:webextRun', 'shell:webextRun']],
      options: {logConcurrentOutput: true},
    },
  });
};
