import * as autoscan from 'scan/autoscan';
import {Scan} from 'scan/scan';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {Config} from 'util/config';

describe('autoscan', function() {
  beforeEach(function() {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('start', function() {
    beforeEach(function() {
      this._browser = window.browser;
      window.browser = {alarms: {create: {}, clear: {},
                                 onAlarm: {addListener: {}}}};
      this.calls = [];
      spyOn(browser.alarms, 'create').and.callFake(() => {
        this.calls.push('create');
      });
      spyOn(browser.alarms, 'clear').and.callFake(() => {
        this.calls.push('clear');
      });
      spyOn(browser.alarms.onAlarm, 'addListener');
    });

    afterEach(function() {
      window.browser = this._browser;
    });

    it('clears existing alarms then configures a new alarm', function(done) {
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(false));

      autoscan.start().then(() => {
        expect(this.calls).toEqual(['clear', 'create']);
        done();
      }).catch((error) => done.fail(error));
    });

    it('uses normal delays when the debug flag is clear', function(done) {
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(false));

      autoscan.start().then(() => {
        expect(browser.alarms.create).toHaveBeenCalledWith(
          'updatescanner-autoscan',
          {delayInMinutes: 1, periodInMinutes: 5});
        done();
      }).catch((error) => done.fail(error));
    });

    it('uses short delays when the debug flag is set', function(done) {
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(true));

      autoscan.start().then(() => {
        expect(browser.alarms.create).toHaveBeenCalledWith(
          'updatescanner-autoscan',
          {delayInMinutes: 0.1, periodInMinutes: 0.5});
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('onAlarm', function() {
    function generatePageMap(pages) {
      let pageMap = new Map();
      pages.forEach((page) => pageMap.set(page.id, page));
      return pageMap;
    }

    it('does nothing if the alarm name doesn\'t match', function() {
      spyOn(PageStore, 'load');
      spyOn(Scan, 'scan').and.returnValues(Promise.resolve());
      spyOn(console, 'log');

      autoscan.__.onAlarm({name: 'illegal-alarm'});

      expect(PageStore.load).not.toHaveBeenCalled();
      expect(Scan.scan).not.toHaveBeenCalled();
    });

    it('scans a pending page', function(done) {
      const pages = [new Page(1, {url: 'http://example.com',
                                    scanRateMinutes: 15,
                                    lastAutoscanTime: Date.now()}),
                    ];
      spyOn(PageStore, 'load').and.returnValues(
        Promise.resolve({pageMap: generatePageMap(pages)}));
      spyOn(Scan, 'scan').and.returnValues(Promise.resolve());
      // spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      autoscan.__.onAlarm({name: 'updatescanner-autoscan'}).then(() => {
        expect(Scan.scan).toHaveBeenCalledWith(pages);
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
      spyOn(PageStore, 'load').and.returnValues(
        Promise.resolve({pageMap: generatePageMap(pages)}));
      spyOn(Scan, 'scan').and.returnValues(Promise.resolve());
      spyOn(console, 'log');

      jasmine.clock().tick(60 * 60 * 1000);

      autoscan.__.onAlarm({name: 'updatescanner-autoscan'}).then(() => {
        expect(Scan.scan).toHaveBeenCalledWith(pages);
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

      spyOn(PageStore, 'load').and.returnValues(Promise.resolve(
        {pageMap: generatePageMap([pageToScan, pageNotToScan])}));
      spyOn(Scan, 'scan').and.returnValues(Promise.resolve());
      spyOn(console, 'log');

      jasmine.clock().tick(20 * 60 * 1000);

      autoscan.__.onAlarm({name: 'updatescanner-autoscan'}).then(() => {
        expect(Scan.scan).toHaveBeenCalledWith([pageToScan]);
        done();
      }).catch((error) => done.fail(error));
    });

    it('ignores a PageFolder', function(done) {
      spyOn(PageStore, 'load').and.returnValues(
        Promise.resolve({pageMap: generatePageMap([new PageFolder(1)])}));
      spyOn(Scan, 'scan').and.returnValues(Promise.resolve());
      spyOn(console, 'log');

      autoscan.__.onAlarm({name: 'updatescanner-autoscan'}).then(() => {
        expect(Scan.scan).not.toHaveBeenCalled();
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('isAutoscanPending', function() {
    it('returns true if an autoscan is just pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5});
      jasmine.clock().tick(5 * 60 * 1000 + 1);

      expect(autoscan.__.isAutoscanPending(page)).toBeTruthy();
    });

    it('returns false if an autoscan is not quite pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5});
      jasmine.clock().tick(5 * 60 * 1000 - 1);

      expect(autoscan.__.isAutoscanPending(page)).toBeFalsy();
    });

    it('returns true if the page has not yet been scanned', function() {
      const page = new Page(1, {scanRateMinutes: 5});

      expect(autoscan.__.isAutoscanPending(page)).toBeTruthy();
    });
  });
});
