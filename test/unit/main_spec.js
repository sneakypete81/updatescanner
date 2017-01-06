/* global Main, Page */

// jasmine.getFixtures().fixturesPath = '/base/test/unit/fixtures';

describe('Main', function() {
  beforeEach(function() {
    this._browser = window.browser;
    window.browser = {storage: {local: {get: {}}}};

    this.main = new Main();
    // Add <div id="main"> to the DOM
    affix('#main');
  });

  afterEach(function() {
    window.browser = this._browser;
  });

  describe('_onSelect', function() {
    it('calls loadIframe with the page\'s html from storage', function(done) {
      const id = '42';
      const html = 'hello';
      spyOn(browser.storage.local, 'get').and.callFake(
        (key) => Promise.resolve({[key]: html}));
      spyOn(this.main, '_loadIframe').and.callFake((result) => {
        expect(result).toEqual(html);
        done();
      });

      this.main._onSelect(new Page(id, {}));
    });

    it('logs to the console if the page\'s html isn\'t found', function(done) {
      const id = '42';
      spyOn(this.main, '_loadIframe');
      spyOn(browser.storage.local, 'get').and.returnValue(Promise.resolve({}));
      spyOn(console, 'log').and.callFake((msg) => {
        expect(msg).toMatch('Error:');
        expect(this.main._loadIframe).not.toHaveBeenCalled();
        done();
      });

      this.main._onSelect(new Page(id, {}));
    });
  });

  describe('_loadIframe', function() {
    it('loads html into an iframe', function() {
      const html = 'This is some <b>HTML</b>.';

      this.main._loadIframe(html);

      expect('#frame').toHaveAttr('srcdoc', html);
    });

    it('loads html into an iframe if one exists already', function() {
      const html1 = 'This is some <b>HTML</b>.';
      const html2 = 'This is some more <b>HTML</b>.';

      this.main._loadIframe(html1);
      this.main._loadIframe(html2);

      expect('#frame').toHaveAttr('srcdoc', html2);
    });
  });

  describe('_removeIframe', function() {
    it('removes the iframe if one exists already', function() {
      $('#main').affix('iframe#frame');
      expect('#main').not.toBeEmpty();

      this.main._removeIframe();

      expect('#main').toBeEmpty();
    });

    it('does nothing if an iframe doesn\'t exist already', function() {
      expect('#main').toBeEmpty();

      this.main._removeIframe();

      expect('#main').toBeEmpty();
    });
  });
});
