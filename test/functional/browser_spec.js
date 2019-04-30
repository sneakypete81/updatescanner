const {until, By, Key} = require('selenium-webdriver');
const {buildAddonDriver, Context, BUILD_TIMEOUT} =
  require('./lib/addon_driver');

describe('Browser', function() {
  beforeEach(async function() {
    this.driver = await buildAddonDriver();
  }, BUILD_TIMEOUT);

  afterEach(function() {
    this.driver.quit();
  });

  it('can control Firefox', async function() {
    this.driver.setContext(Context.CONTENT);
    this.driver.get('http://www.google.com/ncr');
    this.driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);

    await this.driver.wait(until.titleIs('webdriver - Google Search'));
  });
});
