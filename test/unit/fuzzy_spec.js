import 'jasmine-jquery';

import * as fuzzy from 'scan/fuzzy';

describe('fuzzy', function() {
  beforeEach(function() {
    jasmine.getFixtures().fixturesPath = 'base/test/unit/fixtures';
  });
  describe('isMajorChange', function() {
    it('detects identical pages', function() {
      const html1 = readFixtures('amo.html');
      const html2 = html1;
      const major = fuzzy.isMajorChange(html1, html2, 100);
      expect(major).toEqual(false);
    });
  });
});
