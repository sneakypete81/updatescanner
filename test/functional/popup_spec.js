const firefox = require('./lib/firefox');
const ChromePage = require('./pages/chrome.page');

describe('popup', () => {
  beforeEach(async () => {
    await firefox.setContext('chrome');
  });
  afterEach(async () => {
    await firefox.setContext('content');
  });

  it('should have a toolbar button', () => {
    const toolTip = ChromePage.updateScannerButton.getAttribute('tooltiptext');

    expect(toolTip).toEqual('Update Scanner');
  });
});
