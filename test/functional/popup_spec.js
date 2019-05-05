const firefox = require('./lib/firefox');
const ChromePage = require('./pages/chrome.page');

describe('popup', () => {

  beforeEach(async () => {
    this.addonId = await firefox.installAddon(
      __dirname + '/../../src');
    await firefox.setContext('chrome');
  });

  afterEach(async () => {
    await firefox.uninstallAddon(this.addonId);
    await firefox.setContext('content');
  });

  it('has a toolbar button with a tooltip', () => {
    const button = ChromePage.updateScannerButton;

    expect(button.isDisplayed()).toBe(true);
    expect(button.getAttribute('tooltiptext')).toBe('Update Scanner');
  });
});
