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
  },
};
