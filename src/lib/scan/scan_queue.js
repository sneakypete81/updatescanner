import {scanPage} from './scan.js';
import {waitForMs} from '/lib/util/promise.js';

// Allow function mocking
export const __ = {
  scanPage: (...args) => scanPage(...args),
  waitForMs: (...args) => waitForMs(...args),
};

// Wait between scanning pages
const SCAN_IDLE_MS = 2000;

/**
 * @typedef {Object} ScanResult
 * @property {integer} majorChanges Number of pages that had major changes
 * when scanned.
 * @property {integer} scanCount Number of pages that were scanned.
 */

/**
* @callback ScanCompleteHandler
* @param {ScanResult} scanResult Object containing the result of the scan.
*/

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
    this._isScanning = false;
    this._isManualScan = false;
  }

  /**
   * Bind a handler to call whenever a scan is completed.
   *
   * @param {ScanCompleteHandler} handler - Called when a scan completes.
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
   * Start scanning the pages in the queue. When the scan is complete, call
   * the scanComplete handler. Does nothing if a scan is already in progress.
   */
  async scan() {
    if (this._isScanning) {
      return;
    }

    this._isScanning = true;
    const {majorChanges, scanCount} = await this._processScanQueue();
    this._isScanning = false;

    if (this._scanCompleteHandler !== null) {
      this._scanCompleteHandler({
        majorChanges: majorChanges,
        scanCount: scanCount,
        isManualScan: this._isManualScan,
      });
    }
    this._isManualScan = false;
  }

  /**
   * Identical to the scan function, but when the scanComplete handler is called
   * the isManualScan property is set.
   */
  async manualScan() {
    this._isManualScan = true;
    await this.scan();
  }
  /**
   * Scan all pages in the queue. Pages added during the scan are scanned too.
   *
   * @returns {ScanResult} Result of the scan.
   */
  async _processScanQueue() {
    let majorChanges = 0;
    let scanCount = 0;

    while (this.queue.length > 0) {
      const majorChange = await __.scanPage(this.queue.shift());
      if (majorChange) {
        majorChanges++;
      }
      scanCount++;

      if (this.queue.length > 0) {
        await __.waitForMs(SCAN_IDLE_MS);
      }
    }
    return {majorChanges: majorChanges, scanCount: scanCount};
  }
}
