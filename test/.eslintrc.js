module.exports = {
  extends: ['../.eslintrc.js'],

  env: {
    'jasmine': true,
    'jquery': true,
  },

  globals: {
    // From jasmine-fixture
    'affix': false,
  },

  rules: {
    'require-jsdoc': 'off',
    // Complain if specs are left focussed
    'no-restricted-globals': ['warn', 'fdescribe', 'fit'],
  },
};
