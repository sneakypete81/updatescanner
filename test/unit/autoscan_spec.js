/* global Autoscan, PageStore, Page, PageFolder */

describe('Autoscan', function() {
  beforeEach(function() {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('_onAlarm', function() {
    it('does nothing if the alarm name doesn\'t match', function() {
      spyOn(PageStore, 'load');
      spyOn(Autoscan, '_startScan').and.returnValue(Promise.resolve());

      Autoscan._onAlarm({name: 'illegal-alarm'});

      expect(PageStore.load).not.toHaveBeenCalled();
      expect(Autoscan._startScan).not.toHaveBeenCalled();
    });

    it('scans a pending page', function(done) {
      const pages = [new Page(1, {url: 'http://example.com',
                                    scanRateMinutes: 15,
                                    lastAutoscanTime: Date.now()}),
                    ];
      spyOn(Autoscan, '_loadPageList').and.returnValue(Promise.resolve(pages));
      spyOn(Autoscan, '_startScan').and.returnValue(Promise.resolve());
      jasmine.clock().tick(20 * 60 * 1000);

      Autoscan._onAlarm({name: Autoscan.ALARM_ID}).then(() => {
        expect(Autoscan._startScan).toHaveBeenCalledWith(pages);
        done();
      }).catch((error) => done.fail(error));
    });

    it('scans two pending pages', function(done) {
      const pages = [new Page(1, {url: 'http://example.com',
                                  scanRateMinutes: 15,
                                  lastAutoscanTime: Date.now()}),
                     new Page(2, {url: 'http://test.com',
                                  scanRateMinutes: 30,
                                  lastAutoscanTime: Date.now()}),
                    ];
      spyOn(Autoscan, '_loadPageList').and.returnValue(Promise.resolve(pages));
      spyOn(Autoscan, '_startScan').and.returnValue(Promise.resolve());

      jasmine.clock().tick(60 * 60 * 1000);

      Autoscan._onAlarm({name: Autoscan.ALARM_ID}).then(() => {
        expect(Autoscan._startScan).toHaveBeenCalledWith(pages);
        done();
      }).catch((error) => done.fail(error));
    });

    it('scans a pending page and ignores a non-pending page', function(done) {
      const pageToScan = new Page(1, {url: 'http://example.com',
                                      scanRateMinutes: 15,
                                      lastAutoscanTime: Date.now()});
      const pageNotToScan = new Page(2, {url: 'http://test.com',
                                         scanRateMinutes: 30,
                                         lastAutoscanTime: Date.now()});

      spyOn(Autoscan, '_loadPageList').and.returnValue(
        Promise.resolve([pageToScan, pageNotToScan]));
      spyOn(Autoscan, '_startScan').and.returnValue(Promise.resolve());
      jasmine.clock().tick(20 * 60 * 1000);

      Autoscan._onAlarm({name: Autoscan.ALARM_ID}).then(() => {
        expect(Autoscan._startScan).toHaveBeenCalledWith([pageToScan]);
        done();
      }).catch((error) => done.fail(error));
    });

    it('ignores a PageFolder', function(done) {
      spyOn(Autoscan, '_loadPageList').and.returnValue(
        Promise.resolve([new PageFolder(1)]));
      spyOn(Autoscan, '_startScan').and.returnValue(Promise.resolve());

      Autoscan._onAlarm({name: Autoscan.ALARM_ID}).then(() => {
        expect(Autoscan._startScan).not.toHaveBeenCalled();
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('_isAutoscanPending', function() {
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
