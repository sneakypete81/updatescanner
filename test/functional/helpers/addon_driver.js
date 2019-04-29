require('geckodriver');
const {Builder} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const manifest = require('../../../src/manifest');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

module.exports.ADDON_FILE = `dist/update_scanner-${manifest.version}-an.fx.xpi`;

module.exports.buildAddonDriver = () => {
  const options = new firefox.Options();
  // const firefoxBinary = settings.get('firefox', null);
  // if (firefoxBinary) {
  //   options.setBinary(firefoxBinary);
  // }

  const driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

  driver.setContext(firefox.Context.CHROME);
  return driver;
};
