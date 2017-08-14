/* eslint-env node */

module.exports = function(grunt) {
  // Load all NPM tasks
  require('load-grunt-tasks')(grunt);
  grunt.initConfig();

  grunt.registerTask('default', 'Lint, build and test the webextension.',
                     ['build', 'lint', 'test']);

  grunt.registerTask('build', 'Build the webextension.',
                     ['clean', 'webpack:build', 'shell:webextBuild']);

  grunt.registerTask('run', 'Run the webextension with Firefox, watching ' +
                            'and rebuilding when files change.',
                     ['clean', 'webpack:build', 'concurrent:run']);

  grunt.registerTask('lint', 'Check for linter warnings.',
                     ['eslint', 'shell:webextLint']);

  grunt.registerTask('test', 'Run the unit tests.',
                     ['karma:unit']);

  grunt.registerTask('test:watch', 'Run the unit tests, watching and ' +
                                   'rerunning when files change.',
                     ['karma:watch']);

  grunt.registerTask('sign', 'Sign the webextension.',
                     ['shell:webextSign']);

  grunt.config('clean', require('./grunt/clean'));
  grunt.config('shell', require('./grunt/shell'));
  grunt.config('webpack', require('./grunt/webpack'));
  grunt.config('eslint', require('./grunt/eslint'));
  grunt.config('karma', require('./grunt/karma'));

  grunt.config('concurrent', {
    // Run webpack in watch mode alongside webext run
    run: {
      tasks: ['webpack:watch', 'shell:webextRun'],
      options: {logConcurrentOutput: true},
    },
  });
};
