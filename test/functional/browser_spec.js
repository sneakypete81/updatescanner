const firefox = require('./lib/firefox');

describe('browser', () => {

  it('can control Firefox to visit a URL', () => {
    browser.url('https://www.google.com');
    const title = browser.getTitle();

    expect(title).toBe('Google');
  });

  it('can be set to chrome context', async () => {
    await firefox.setContext('chrome');

    try {
      expect(await firefox.getContext()).toBe('chrome');

    } finally {
      await firefox.setContext('content');
    }
  });
});
