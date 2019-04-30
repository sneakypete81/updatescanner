const {until} = require('selenium-webdriver');
const {buildAddonDriver, Context, ADDON_FILE, BUILD_TIMEOUT} =
  require('./lib/addon_driver');
const {TOOLBAR_BUTTON} = require('./lib/toolbar');

describe('Popup', function() {
  beforeEach(async function() {
    this.driver = await buildAddonDriver();
    this.driver.setContext(Context.CHROME);
    await this.driver.installAddon(ADDON_FILE, true);
  }, BUILD_TIMEOUT);


  afterEach(function() {
    this.driver.quit();
  });

  it('should have a toolbar button', async function() {
    const button = await this.driver.wait(until.elementLocated(TOOLBAR_BUTTON));

    expect(await button.getAttribute('tooltiptext')).toEqual('Update Scanner');
  });
});
