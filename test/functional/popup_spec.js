const {until} = require('selenium-webdriver');
const {buildAddonDriver, ADDON_FILE} = require('./helpers/addon_driver');
const {TOOLBAR_BUTTON} = require('./helpers/toolbar');

describe('Popup', function() {
  beforeEach(async function() {
    this.driver = buildAddonDriver();
    await this.driver.installAddon(ADDON_FILE, true);
  });

  afterEach(function() {
    this.driver.quit();
  });

  it('should have a toolbar button', async function() {
    const button = await this.driver.wait(until.elementLocated(TOOLBAR_BUTTON));

    expect(await button.getAttribute('tooltiptext')).toEqual('Update Scanner');
  });
});
