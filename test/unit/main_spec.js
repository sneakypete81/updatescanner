/* eslint-env jasmine,jquery */
/* global affix */
/* global Main */

// jasmine.getFixtures().fixturesPath = '/base/test/unit/fixtures';

describe('Main', function() {
  beforeEach(function() {
    this.main = new Main();
    // Add <div id="main"> to the DOM
    affix('#main');
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
