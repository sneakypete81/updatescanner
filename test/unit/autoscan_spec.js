/* global Autoscan, PageStore, Page */

describe('Autoscan', function() {
  describe('_onAlarm', function() {
    it('does nothing if the alarm name doesn\'t match', function() {
      spyOn(PageStore, 'load');

      Autoscan._onAlarm({name: 'illegal-alarm'});

      expect(PageStore.load).not.toHaveBeenCalled();
    });
  });

  describe('_isAutoscanPending', function() {
    beforeEach(function() {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('returns true if an autoscan is just pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5});
      jasmine.clock().tick(5 * 60 * 1000 + 1);

      expect(Autoscan._isAutoscanPending(page)).toBeTruthy();
    });

    it('returns false if an autoscan is not quite pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5});
      jasmine.clock().tick(5 * 60 * 1000 - 1);

      expect(Autoscan._isAutoscanPending(page)).toBeFalsy();
    });

    it('returns true if the page has not yet been scanned', function() {
      const page = new Page(1, {scanRateMinutes: 5});

      expect(Autoscan._isAutoscanPending(page)).toBeTruthy();
    });
  });
});
