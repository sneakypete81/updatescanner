/* eslint-env jasmine,jquery */
/* global affix */
/* global Main */

// jasmine.getFixtures().fixturesPath = '/base/test/unit/fixtures';

describe('Main', function() {
  beforeEach(function() {
    this.main = new Main();
  });

  describe('clearIframe', function() {
    it('removes the iframe if one exists', function() {
      const mainContainer = affix('#main');
      mainContainer.affix('iframe#frame');
      expect(mainContainer).not.toBeEmpty();

      this.main.clearIframe();

      expect(mainContainer).toBeEmpty();
    });

    it('does nothing if an iframe doesn\'t exist', function() {
      const mainContainer = affix('#main');
      expect(mainContainer).toBeEmpty();

      this.main.clearIframe();

      expect(mainContainer).toBeEmpty();
    });
  });
});
