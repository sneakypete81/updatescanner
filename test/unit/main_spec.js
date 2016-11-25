/* eslint-env jasmine, jquery */
/* global affix */
/* global Main */

// jasmine.getFixtures().fixturesPath = '/base/test/unit/fixtures';

// sinon-chrome doesn't implement browser.storage promises correctly yet,
// so override the stub with a custom spy
chrome.storage = {local: {get: null}};

function spyOnStorageGet(result) {
  spyOn(browser.storage.local, 'get').and.returnValue(
    Promise.resolve(result));
}

describe('Main', function() {
  beforeEach(function() {
    /* global browser:true */
    // sinon-chrome-webextensions currently exports 'chrome' for some reason
    browser = chrome;
    browser.flush();

    this.main = new Main();
    // Add <div id="main"> to the DOM
    affix('#main');
  });

  afterEach(function() {
    /* eslint no-delete-var: 'off' */
    delete browser;
  });

  describe('onSidebarChanged', function() {
    it('calls loadIframe with the page\'s html from storage', function(done) {
      const id = '42';
      const html = 'hello';
      spyOnStorageGet({['html:' + id]: html});

      spyOn(this.main, 'loadIframe').and.callFake((result) => {
        expect(result).toBe(html);
        done();
      });

      this.main.onSidebarChanged(null, {selected: ['id:' + id]});
    });
  });

  describe('loadHtml', function() {
    it('returns the page\'s html from storage', function(done) {
      const id = '42';
      const html = 'hello';
      spyOnStorageGet({['html:' + id]: html});

      this.main.loadHtml(id)
        .then(function(result) {
          expect(result).toBe('hello');
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('fails when the page id doesn\'t exist in storage', function(done) {
      const id = '42';
      spyOnStorageGet({});

      this.main.loadHtml(id)
        .then(function(result) {
          done.fail('loadHtml unexpectedly returned a successful promise.');
        })
        .catch((error) => done());
    });
  });

  describe('loadIframe', function() {
    it('loads html into an iframe', function() {
      const html = 'This is some <b>HTML</b>.';

      this.main.loadIframe(html);

      expect('#frame').toHaveAttr('srcdoc', html);
    });

    it('loads html into an iframe if one exists already', function() {
      const html1 = 'This is some <b>HTML</b>.';
      const html2 = 'This is some more <b>HTML</b>.';

      this.main.loadIframe(html1);
      this.main.loadIframe(html2);

      expect('#frame').toHaveAttr('srcdoc', html2);
    });
  });

  describe('clearIframe', function() {
    it('removes the iframe if one exists already', function() {
      $('#main').affix('iframe#frame');
      expect('#main').not.toBeEmpty();

      this.main.clearIframe();

      expect('#main').toBeEmpty();
    });

    it('does nothing if an iframe doesn\'t exist already', function() {
      expect('#main').toBeEmpty();

      this.main.clearIframe();

      expect('#main').toBeEmpty();
    });
  });
});
