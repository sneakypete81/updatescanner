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

    while (this.queue.length > 0) {
      const majorChange = await scanPage(this.queue.shift());
      if (majorChange) {
        majorChanges++;
      }

      if (this.queue.length > 0) {
        await waitForMs(SCAN_IDLE_MS);
      }
    }
    return majorChanges;
  }
}
