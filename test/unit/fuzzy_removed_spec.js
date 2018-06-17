// import using from
//    '/test/dependencies/include/jasmine-data-provider/src/index.js';
/* global using */

import * as fuzzy from '/lib/scan/fuzzy.js';

describe('fuzzy', function() {
  beforeEach(function() {
    jasmine.getFixtures().fixturesPath = 'base/test/unit/fixtures';
  });
  describe('isMajorChange', function() {
    it('detects a single character removed with threshold=0', function() {
      const html1 = readFixtures('amo.html');
      const html2 = html1.slice(0, 1093) + html1.slice(1094);
      const major = fuzzy.isMajorChange(html1, html2, 0);
      expect(major).toEqual(true);
    });

    using([
      {slice: 5, threshold: 10, major: false},
      {slice: 20, threshold: 10, major: true},
      {slice: 25, threshold: 50, major: false},
      {slice: 100, threshold: 50, major: true},
      {slice: 50, threshold: 100, major: false},
      {slice: 200, threshold: 100, major: true},
      {slice: 250, threshold: 500, major: false},
      {slice: 1000, threshold: 500, major: true},
    ], function(data) {
      it('returns ' + data.major + ' when ' + data.slice + ' characters are ' +
         'removed from start with threshold=' + data.threshold, function() {
        const html1 = readFixtures('amo.html');
        const html2 = html1.slice(data.slice);
        const major = fuzzy.isMajorChange(html1, html2, data.threshold);

        expect(major).toEqual(data.major);
      });
    });

    using([
      {slice: 5, threshold: 10, major: false},
      {slice: 20, threshold: 10, major: true},
      {slice: 25, threshold: 50, major: false},
      {slice: 100, threshold: 50, major: true},
      {slice: 50, threshold: 100, major: false},
      {slice: 200, threshold: 100, major: true},
      {slice: 250, threshold: 500, major: false},
      {slice: 1000, threshold: 500, major: true},
    ], function(data) {
      it('returns ' + data.major + ' when ' + data.slice + ' characters are ' +
         'removed from end with threshold=' + data.threshold, function() {
        const html1 = readFixtures('amo.html');
        const html2 = html1.slice(0, -data.slice);
        const major = fuzzy.isMajorChange(html1, html2, data.threshold);

        expect(major).toEqual(data.major);
      });
    });

    using([
      {slice: 5, threshold: 10, pos: 937, major: false},
      {slice: 20, threshold: 10, pos: 937, major: true},
      {slice: 25, threshold: 50, pos: 43, major: false},
      {slice: 100, threshold: 50, pos: 43, major: true},
      {slice: 50, threshold: 100, pos: 629, major: false},
      {slice: 200, threshold: 100, pos: 629, major: true},
      {slice: 250, threshold: 500, pos: 2362, major: false},
      {slice: 1000, threshold: 500, pos: 2362, major: true},
    ], function(data) {
      it('returns ' + data.major + ' when ' + data.slice + ' characters are ' +
         'removed from the middle with threshold=' + data.threshold,
         function() {
        const html1 = readFixtures('amo.html');
        const html2 = html1.slice(0, data.pos) +
                      html1.slice(data.pos + data.slice);
        const major = fuzzy.isMajorChange(html1, html2, data.threshold);

        expect(major).toEqual(data.major);
      });
    });

    using([
      {slice: 5, threshold: 10, pos1: 937, pos2: 4824, major: false},
      {slice: 20, threshold: 10, pos1: 937, pos2: 4824, major: true},
      {slice: 25, threshold: 50, pos1: 43, pos2: 1138, major: false},
      {slice: 100, threshold: 50, pos1: 43, pos2: 1138, major: true},
      {slice: 50, threshold: 100, pos1: 629, pos2: 880, major: false},
      {slice: 200, threshold: 100, pos1: 629, pos2: 880, major: true},
      {slice: 250, threshold: 500, pos1: 2362, pos2: 3971, major: false},
      {slice: 1000, threshold: 500, pos1: 2362, pos2: 3971, major: true},
    ], function(data) {
      it('returns ' + data.major + ' when ' + data.slice + ' characters are ' +
         'removed from two places with threshold=' + data.threshold,
         function() {
        const html1 = readFixtures('amo.html');
        const html2 = html1.slice(0, data.pos1) +
                      html1.slice(data.pos1 + data.slice, data.pos2) +
                      html1.slice(data.pos2 + data.slice);
        const major = fuzzy.isMajorChange(html1, html2, data.threshold);

        expect(major).toEqual(data.major);
      });
    });
  });
});
