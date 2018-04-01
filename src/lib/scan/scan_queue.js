import {scanPage} from 'scan/scan';
import {waitForMs} from 'util/promise';

// Wait between scanning pages
const SCAN_IDLE_MS = 2000;

/**
 * Class to maintain a queue of pages to scan.
 */
export class ScanQueue {
  /**
   * Create a new empty queue.
   */
  constructor() {
    this.queue = [];
    this._scanCompleteHandler = null;
  }

  /**
   * Bind a handler to call whenever a scan is completed. The handler is passed
   * an object containing the following
   *  {integer} majorChanges: Number of major changes detected
   *  {integer} scanCount: Total number of pages scanned.
   *
   * @param {Function} handler - Function to call whenever a scan is completed.
   */
  bindScanComplete(handler) {
    this._scanCompleteHandler = handler;
  }

  /**
   * Add a list of pages to the queue. Ignore pages that are already queued.
   *
   * @param {Array.<Page>} pageList - List of pages to add to the queue.
   */
  add(pageList) {
    for (const page of pageList) {
      if (!this.queue.includes(page)) {
        this.queue.push(page);
      }
    }
  }

  /**
   * Start scanning the pages in the queue.
   *
   * @returns {integer} Number of pages that had major changes when scanned.
   */
  async scan() {
    let majorChanges = 0;
    let scanCount = 0;

    while (this.queue.length > 0) {
      const majorChange = await scanPage(this.queue.shift());
      if (majorChange) {
        majorChanges++;
      }
      scanCount++;

      if (this.queue.length > 0) {
        await waitForMs(SCAN_IDLE_MS);
      }
    }

    if (this._scanCompleteHandler !== null) {
      this._scanCompleteHandler({
        majorChanges: majorChanges,
        scanCount: scanCount,
      });
    }
    return majorChanges;
  }
}
