import {Autoscan} from '/lib/scan/autoscan.js';
import * as autoscanModule from '/lib/scan/autoscan.js';
import {ScanQueue} from '/lib/scan/scan_queue.js';
import {Config} from '/lib/util/config.js';
import {Storage} from '/lib/util/storage.js';
import {type} from '/lib/redux/ducks/type.js';

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
        {delayInMinutes: 1, periodInMinutes: 5},
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
        {delayInMinutes: 0.1, periodInMinutes: 0.5},
      );
    });
  });

  describe('onAlarm', function() {
    beforeEach(function() {
      this.scanQueue = new ScanQueue();
      spyOn(this.scanQueue, 'add');
      spyOn(this.scanQueue, 'scan');
      spyOn(Config, 'loadSingleSetting').and.returnValue(
        Promise.resolve(false));
    });

    it('does nothing if the alarm name doesn\'t match', function() {
      spyOn(console, 'log');
      spyOn(autoscanModule.__.store, 'getState');

      const autoscan = new Autoscan(this.scanQueue, this.pageStore);
      autoscan.onAlarm({name: 'illegal-alarm'});

      expect(autoscanModule.__.store.getState).not.toHaveBeenCalled();
      expect(this.scanQueue.add).not.toHaveBeenCalled();
      expect(this.scanQueue.scan).not.toHaveBeenCalled();
    });

    it('scans a pending page', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          url: 'http://example.com',
          scanRateMinutes: 15,
          lastAutoscanTime: Date.now(),
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});

      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith(Object.keys(pages));
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });

    it('scans two pending pages', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          url: 'http://example.com',
          scanRateMinutes: 15,
          lastAutoscanTime: Date.now(),
        },
        '2': {
          type: type.PAGE,
          url: 'http://test.com',
          scanRateMinutes: 30,
          lastAutoscanTime: Date.now(),
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});
      spyOn(console, 'log');
      jasmine.clock().tick(60 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith(Object.keys(pages));
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });

    it('scans a pending page and ignores a non-pending page', function() {
      const pageToScan = {
        type: type.PAGE,
        url: 'http://example.com',
        scanRateMinutes: 15,
        lastAutoscanTime: Date.now(),
      };
      const pageNotToScan = {
        type: type.PAGE,
        url: 'http://test.com',
        scanRateMinutes: 30,
        lastAutoscanTime: Date.now(),
      };
      const pages = {'1': pageToScan, '2': pageNotToScan};
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});
      spyOn(console, 'log');
      jasmine.clock().tick(20 * 60 * 1000);

      const autoscan = new Autoscan(this.scanQueue);
      autoscan.onAlarm({name: 'updatescanner-autoscan'});

      expect(this.scanQueue.add).toHaveBeenCalledWith(['1']);
      expect(this.scanQueue.scan).toHaveBeenCalled();
    });
  });

  describe('isAutoscanPending', function() {
    it('returns true if an autoscan is just pending', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          lastAutoscanTime: Date.now(),
          scanRateMinutes: 5,
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});
      jasmine.clock().tick(5 * 60 * 1000 + 1);

      expect(autoscanModule.__.isAutoscanPending('1')).toBeTruthy();
    });

    it('returns false if an autoscan is not quite pending', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          lastAutoscanTime: Date.now(),
          scanRateMinutes: 5,
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});
      jasmine.clock().tick(5 * 60 * 1000 - 1);

      expect(autoscanModule.__.isAutoscanPending('1')).toBeFalsy();
    });

    it('returns false if autoscan is disabled for the page', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          lastAutoscanTime: Date.now(),
          scanRateMinutes: 0,
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});
      jasmine.clock().tick(5 * 60 * 1000);

      expect(autoscanModule.__.isAutoscanPending('1')).toBeFalsy();
    });

    it('returns true if the page has not yet been scanned', function() {
      const pages = {
        '1': {
          type: type.PAGE,
          scanRateMinutes: 5,
          lastAutoscanTime: null,
        },
      };
      spyOn(autoscanModule.__.store, 'getState').and.returnValue({pages});

      expect(autoscanModule.__.isAutoscanPending('1')).toBeTruthy();
    });
  });
});
