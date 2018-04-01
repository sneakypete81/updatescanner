import {ScanQueue} from 'scan/scan_queue';
import {Page} from 'page/page';
import * as scan from 'scan/scan';
import * as promise from 'util/promise';

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
      spyOn(promise, 'waitForMs');
    });

    it('does nothing if the queue is empty', async function() {
      const scanQueue = new ScanQueue();
      spyOn(scan, 'scanPage');

      await scanQueue.scan();

      expect(scan.scanPage).not.toHaveBeenCalled();
    });

    it('scans a single page', async function() {
      const scanQueue = new ScanQueue();
      const page = new Page(1, {});
      scanQueue.add([page]);
      spyOn(scan, 'scanPage');

      await scanQueue.scan();

      expect(scan.scanPage).toHaveBeenCalledWith(page);
    });

    it('scans two pages', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      scanQueue.add([page1, page2]);
      spyOn(scan, 'scanPage');

      await scanQueue.scan();

      expect(scan.scanPage).toHaveBeenCalledWith(page1);
      expect(scan.scanPage).toHaveBeenCalledWith(page2);
    });

    it('returns the number of major changes reported', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(2, {});
      scanQueue.add([page1, page2, page3]);
      spyOn(scan, 'scanPage').and.returnValues(
        new Promise((resolve) => resolve(true)),
        new Promise((resolve) => resolve(false)),
        new Promise((resolve) => resolve(true)),
      );

      const result = await scanQueue.scan();

      expect(result).toEqual(2);
    });

    it('waits for 2s between scanning pages', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(3, {});
      scanQueue.add([page1, page2, page3]);
      spyOn(scan, 'scanPage');

      await scanQueue.scan();

      expect(promise.waitForMs.calls.allArgs()).toEqual([[2000], [2000]]);
    });

    it('scans a page added after the scan has started', async function() {
      const scanQueue = new ScanQueue();
      const page1 = new Page(1, {});
      const page2 = new Page(2, {});
      const page3 = new Page(3, {});
      scanQueue.add([page1, page2]);
      spyOn(scan, 'scanPage').and.callFake(() => {
        scanQueue.add([page3]);
        scan.scanPage.and.stub();
      });

      await scanQueue.scan();

      expect(scan.scanPage.calls.allArgs())
        .toEqual([[page1], [page2], [page3]]);
    });
  });
});
