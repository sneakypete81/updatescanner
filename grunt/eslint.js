module.exports = {
  options: {
    ignorePattern: [
      'node_modules/',
      'coverage/',
      'build/',
      'src/dependencies',
      'test/dependencies',
    ],
    maxWarnings: 0,
  },
  target: ['.'],
};
