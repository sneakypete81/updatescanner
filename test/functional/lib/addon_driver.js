require('geckodriver');
const {Builder} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const manifest = require('../../../src/manifest');

module.exports.Context = firefox.Context;
module.exports.BUILD_TIMEOUT = 30000; // <30 seconds to start Firefox
module.exports.ADDON_FILE = `dist/update_scanner-${manifest.version}-an.fx.xpi`;

module.exports.buildAddonDriver = async () => {
  const options = new firefox.Options();
  // const firefoxBinary = settings.get('firefox', null);
  // if (firefoxBinary) {
  //   options.setBinary(firefoxBinary);
  // }

  const driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

  await driver.getTitle();

  return driver;
};

