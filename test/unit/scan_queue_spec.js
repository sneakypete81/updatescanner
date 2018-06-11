import {ScanQueue} from '/lib/scan/scan_queue.js';
import * as scanQueueModule from '/lib/scan/scan_queue.js';
import {Page} from '/lib/page/page.js';

describe('Scan Queue', function() {
  describe('add', function() {
    it('adds a page to an empty queue', function() {
      const scanQueue = new ScanQueue();
      const page = new Page(1, {});

      scanQueue.add([page]);

      expect(scanQueue.queue).toEqual([page]);
    });

    it('adds two pages to an empty queue', function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});

      scanQueue.add([page1, page2]);

      expect(scanQueue.queue).toEqual([page1, page2]);
    });

    it('adds two pages to a non-empty queue', function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(3, {});
      const page4 = new Page(4, {});
      scanQueue.add([page1, page2]);

      scanQueue.add([page3, page4]);

      expect(scanQueue.queue).toEqual([page1, page2, page3, page4]);
    });

    it('doesn\'t add a page if it is already in the queue', function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      scanQueue.add([page1, page2]);

      scanQueue.add([page1]);

      expect(scanQueue.queue).toEqual([page1, page2]);
    });
  });

  describe('scan', function() {
    beforeEach(function() {
      spyOn(scanQueueModule.__, 'waitForMs');
    });

    it('does nothing if the queue is empty', async function() {
      const scanQueue = new ScanQueue();
      spyOn(scanQueueModule.__, 'scanPage');

      await scanQueue.scan();

      expect(scanQueueModule.__.scanPage).not.toHaveBeenCalled();
    });

    it('scans a single page', async function() {
      const scanQueue = new ScanQueue();
      const page = new Page(1, {});
      scanQueue.add([page]);
      spyOn(scanQueueModule.__, 'scanPage');

      await scanQueue.scan();

      expect(scanQueueModule.__.scanPage).toHaveBeenCalledWith(page);
    });

    it('scans two pages', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      scanQueue.add([page1, page2]);
      spyOn(scanQueueModule.__, 'scanPage');

      await scanQueue.scan();

      expect(scanQueueModule.__.scanPage).toHaveBeenCalledWith(page1);
      expect(scanQueueModule.__.scanPage).toHaveBeenCalledWith(page2);
    });

    it('waits for 2s between scanning pages', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(3, {});
      scanQueue.add([page1, page2, page3]);
      spyOn(scanQueueModule.__, 'scanPage');

      await scanQueue.scan();

      expect(scanQueueModule.__.waitForMs.calls.allArgs())
        .toEqual([[2000], [2000]]);
    });

    it('scans a page added after the scan has started', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(3, {});
      scanQueue.add([page1, page2]);
      spyOn(scanQueueModule.__, 'scanPage').and.callFake(() => {
        // Add another page to the queue mid-scan
        scanQueue.add([page3]);
        scanQueueModule.__.scanPage.and.stub();
      });

      await scanQueue.scan();

      expect(scanQueueModule.__.scanPage.calls.allArgs())
        .toEqual([[page1], [page2], [page3]]);
    });

    it('does nothing if a scan is already running', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      scanQueue.add([page1, page2]);
      spyOn(scanQueueModule.__, 'scanPage').and.callFake(() => {
        // Call scan again (nothing should happen)
        scanQueue.scan();
      });
      spyOn(scanQueue, '_processScanQueue').and.callThrough();

      await scanQueue.scan();

      expect(scanQueue._processScanQueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('bindScanComplete', function() {
    beforeEach(function() {
      spyOn(scanQueueModule.__, 'waitForMs');
    });

    it('binds a handler that is called when the scan completes',
    async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(1, {});
      const page3 = new Page(1, {});
      scanQueue.add([page1, page2, page3]);
      spyOn(scanQueueModule.__, 'scanPage').and.returnValues(
        new Promise((resolve) => resolve(true)),
        new Promise((resolve) => resolve(false)),
        new Promise((resolve) => resolve(true)),
      );
      const handler = jasmine.createSpy();

      scanQueue.bindScanComplete(handler);
      await scanQueue.scan();

      expect(handler).toHaveBeenCalledWith({
        majorChanges: 2,
        scanCount: 3,
        isManualScan: false,
      });
    });

    it('signals to the handler then a manual scan is performed',
    async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      scanQueue.add([page1]);
      const handler = jasmine.createSpy();
      spyOn(scanQueueModule.__, 'scanPage');

      scanQueue.bindScanComplete(handler);
      await scanQueue.manualScan();

      expect(handler).toHaveBeenCalledWith({
        majorChanges: 0,
        scanCount: 1,
        isManualScan: true,
      });
    });
  });
});
