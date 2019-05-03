const firefox = require('./lib/firefox');

describe('browser', () => {
  it('can control Firefox', () => {
    browser.url('https://www.google.com');
    const title = browser.getTitle();

    expect(title).toEqual('Google');
  });

  it('can be set to chrome context', async () => {
    await firefox.setContext('chrome');

    try {
      expect(await firefox.getContext()).toEqual('chrome');

    } finally {
      await firefox.setContext('content');
    }
  });
});
