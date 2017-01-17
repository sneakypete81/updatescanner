// Custom environment variables for Firefox
// Uses options.add so that these can be overridden by the environment.

module.exports = {
  karma: {options: {add: {
    FIREFOX_BIN: 'firefox-developer',
  }}},

  webextRun: {options: {add: {
    WEB_EXT_FIREFOX: 'firefox-developer',
    WEB_EXT_FIREFOX_PROFILE: 'dev-edition-default',
  }}},
};
