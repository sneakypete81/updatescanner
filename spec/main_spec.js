/* eslint-env jasmine,jquery */
/* global loadFixtures */
/* global clearIframe */

jasmine.getFixtures().fixturesPath = 'spec/fixtures';

describe('Main', function() {
  beforeEach(function() {
    loadFixtures('main.html');
  });

  describe('clearIframe', function() {
    it('removes the iframe if one exists', function() {
      const mainContainer = $('#main');
      mainContainer.append('<iframe id="frame"></iframe>');
      expect(mainContainer).not.toBeEmpty();
      clearIframe();
      expect(mainContainer).toBeEmpty();
    });

    it('does nothing if an iframe doesn\'t exist', function() {
      const mainContainer = $('#main');
      expect(mainContainer).toBeEmpty();
      clearIframe();
      expect(mainContainer).toBeEmpty();
    });
  });
});
