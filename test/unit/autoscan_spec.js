import {Autoscan} from '/lib/scan/autoscan.js';
import * as autoscanModule from '/lib/scan/autoscan.js';
import {ScanQueue} from '/lib/scan/scan_queue.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {Config} from '/lib/util/config.js';
import {Storage} from '/lib/util/storage.js';

describe('Autoscan', function() {
  beforeEach(function() {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));

    spyOn(Storage, 'addListener');
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('start', function() {
    beforeEach(function() {
      this._browser = window.browser;
      window.browser = {
        alarms: {
          create: {},
          clear: {},
          onAlarm: {
            addListener: {},
          },
        },
      };
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

    it('clears existing alarms then configures a new alarm', async function() {
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(false));

      const autoscan = new Autoscan(null, null);
      await autoscan.start();

      expect(this.calls).toEqual(['clear', 'create']);
    });

    it('uses normal delays when the debug flag is clear', async function() {
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(false));

      const autoscan = new Autoscan(null, null);
      await autoscan.start();

      expect(browser.alarms.create).toHaveBeenCalledWith(
        'updatescanner-autoscan',
        {delayInMinutes: 1, periodInMinutes: 5}
      );
    });

    it('uses short delays when the debug flag is set', async function() {
      spyOn(autoscanModule.__, 'log');
      spyOn(Config, 'loadSingleSetting').and.returnValues(
        Promise.resolve(true));

      const autoscan = new Autoscan(null, null);
      await autoscan.start();

      expect(browser.alarms.create).toHaveBeenCalledWith(
        'updatescanner-autoscan',
        {delayInMinutes: 0.1, periodInMinutes: 0.5}
      );
    });
  });

  describe('onAlarm', function() {
    beforeEach(function() {
      this.pageStore = new PageStore(new Map());
      this.scanQueue = new ScanQueue();
      spyOn(this.scanQueue, 'add');
      spyOn(this.scanQueue, 'scan');
      spyOn(Config, 'loadSingleSetting').and.returnValue(
        Promise.resolve(false));
    });

    it('does nothing if the alarm name doesn\'t match', function() {
      spyOn(console, 'log');
      spyOn(this.pageStore, 'getPageList');

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'illegal-alarm'});

      expect(this.pageStore.getPageList).not.toHaveBeenCalled();
      expect(this.scanQueue.add).not.toHaveBeenCalled();
      expect(this.scanQueue.scan).not.toHaveBeenCalled();
    });

    it('scans a pending page', function() {
      const pages = [
        new Page(1, {
          url: 'http://example.com',
          scanRateMinutes: 15,
          lastAutoscanTime: Date.now(),
        }),
      ];
      spyOn(this.pageStore, 'getPageList').and.returnValues(pages);
      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith(pages);
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });

    it('scans two pending pages', function() {
      const pages = [
        new Page(1, {
          url: 'http://example.com',
          scanRateMinutes: 15,
          lastAutoscanTime: Date.now(),
        }),
        new Page(2, {
          url: 'http://test.com',
          scanRateMinutes: 30,
          lastAutoscanTime: Date.now(),
        }),
      ];
      spyOn(this.pageStore, 'getPageList').and.returnValues(pages);
      spyOn(console, 'log');
      jasmine.clock().tick(60 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith(pages);
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });

    it('scans a pending page and ignores a non-pending page', function() {
      const pageToScan = new Page(1, {
        url: 'http://example.com',
        scanRateMinutes: 15,
        lastAutoscanTime: Date.now(),
      });
      const pageNotToScan = new Page(2, {
        url: 'http://test.com',
        scanRateMinutes: 30,
        lastAutoscanTime: Date.now(),
      });
      const pages = [pageToScan, pageNotToScan];
      spyOn(this.pageStore, 'getPageList').and.returnValues(pages);
      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith([pageToScan]);
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });

    it('updates lastAutoscanTime when a page is scanned', function() {
      const pages = [
        new Page(1, {
          url: 'http://example.com',
          scanRateMinutes: 15,
          lastAutoscanTime: Date.now(),
        }),
      ];
      spyOn(pages[0], 'save');
      spyOn(this.pageStore, 'getPageList').and.returnValues(pages);
      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(pages[0].save).toHaveBeenCalled();
      expect(pages[0].lastAutoscanTime).toEqual(Date.now());
    });

    it('doesn\'t update lastAutoscanTime if a page is skipped', function() {
      const pages = [
        new Page(1, {
          url: 'http://example.com',
          scanRateMinutes: 30,
          lastAutoscanTime: Date.now(),
        }),
      ];
      spyOn(pages[0], 'save');
      spyOn(this.pageStore, 'getPageList').and.returnValues(pages);
      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(pages[0].save).not.toHaveBeenCalled();
      expect(pages[0].lastAutoscanTime).not.toEqual(Date.now());
    });
  });

  describe('isAutoscanPending', function() {
    it('returns true if an autoscan is just pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5,
      });
      jasmine.clock().tick(5 * 60 * 1000 + 1);

      expect(autoscanModule.__.isAutoscanPending(page)).toBeTruthy();
    });

    it('returns false if an autoscan is not quite pending', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 5,
      });
      jasmine.clock().tick(5 * 60 * 1000 - 1);

      expect(autoscanModule.__.isAutoscanPending(page)).toBeFalsy();
    });

    it('returns false if autoscan is disabled for the page', function() {
      const page = new Page(1, {
        lastAutoscanTime: Date.now(),
        scanRateMinutes: 0,
      });
      jasmine.clock().tick(5 * 60 * 1000);

      expect(autoscanModule.__.isAutoscanPending(page)).toBeFalsy();
    });

    it('returns true if the page has not yet been scanned', function() {
      const page = new Page(1, {scanRateMinutes: 5});

      expect(autoscanModule.__.isAutoscanPending(page)).toBeTruthy();
    });
  });
});
