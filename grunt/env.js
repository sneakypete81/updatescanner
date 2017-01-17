// Custom environment variables for Firefox to run the Developer Edition.
// Uses options.add so that these can be overridden by the environment.

module.exports = {
  karma: {options: {add: {
    FIREFOX_BIN: 'firefox-developer',
  }}},

  webextRun: {options: {add: {
    WEB_EXT_FIREFOX: 'firefox-developer',
  }}},
};
