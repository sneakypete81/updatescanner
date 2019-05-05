const firefox = require('./lib/firefox');
const ChromePage = require('./pages/chrome.page');

describe('popup', () => {
  let addonId = null;

  beforeEach(async () => {
    addonId = await firefox.installAddon(
      __dirname + '/../../src');
    await firefox.setContext('chrome');
  });
  afterEach(async () => {
    await firefox.uninstallAddon(addonId);
    await firefox.setContext('content');
  });

  it('should have a toolbar button', () => {
    const toolTip = ChromePage.updateScannerButton.getAttribute('tooltiptext');

    expect(toolTip).toEqual('Update Scanner');
  });
});
