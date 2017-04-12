// Custom environment variables for Firefox to run the Developer Edition.
// Uses options.add so that these can be overridden by the environment.

const os = require('os');

let FIREFOX_BIN;
if (os.platform() == 'win32') {
  FIREFOX_BIN =
    'c:\\Program Files (x86)\\Firefox Developer Edition\\firefox.exe';
} else {
  FIREFOX_BIN = 'firefox-developer';
}

module.exports = {
  karma: {options: {add: {
    FIREFOX_BIN: FIREFOX_BIN,
  }}},

  webextRun: {options: {add: {
    WEB_EXT_FIREFOX: FIREFOX_BIN,
  }}},
};
