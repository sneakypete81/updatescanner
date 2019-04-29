const {until, By, Key} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const {buildAddonDriver} = require('./helpers/addon_driver');

describe('Browser', function() {
  beforeEach(function() {
    this.driver = buildAddonDriver();
  });

  afterEach(function() {
    this.driver.quit();
  });

  it('can control Firefox', async function() {
    this.driver.setContext(firefox.Context.CONTENT);
    this.driver.get('http://www.google.com/ncr');
    this.driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);

    await this.driver.wait(until.titleIs('webdriver - Google Search'));
  });
});
