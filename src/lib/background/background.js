import {backgroundActionEnum} from './actions.js';
import {Autoscan} from '/lib/scan/autoscan.js';
import {ScanQueue} from '/lib/scan/scan_queue.js';
import {showNotification} from '/lib/scan/notification.js';
import {isUpToDate, latestVersion} from '/lib/update/update.js';
import {openUpdate} from '/lib/update/update_url.js';
import {log} from '/lib/util/log.js';
import {Config} from '/lib/util/config.js';
import {store} from '/lib/redux/store.js';
import {
  addPage, getChangedPageIds, getDescendentPageIds,
} from '/lib/redux/ducks/pages.js';

const activeIcon = {
  18: '/images/updatescanner_18.png',
  48: '/images/updatescanner_48.png',
  64: '/images/updatescanner_64.png',
};

/**
 * Class representing the Update Scanner background process.
 */
export class Background {
  /**
   * @property {ScanQueue} scanQueue - Queue of pages to be scanned.
   */
  constructor() {
    this.scanQueue = null;
  }

  /**
   * Start the background processes and listeners.
   */
  async init() {
    browser.runtime.onMessage.addListener(this._handleMessage.bind(this));

    this.scanQueue = new ScanQueue();
    this.scanQueue.bindScanComplete(this._handleScanComplete.bind(this));

    await this._checkFirstRun();
    await this._checkIfUpdateRequired();

    const autoscan = new Autoscan(this.scanQueue);
    autoscan.start();

    this._render();
    store.subscribe(() => this._render());
  }

  /**
   * Called when a message is sent to the background process.
   *
   * @param {object} message - Message content.
   */
  _handleMessage(message) {
    if (message.action == backgroundActionEnum.SCAN_ALL) {
      this._scanAll();
    } else if (message.action == backgroundActionEnum.SCAN_ITEM) {
      this._scanItem(message.itemId);
    }
  }

  /**
   * Called whenever the UI needs to be re-rendered from the Redux store.
   */
  _render() {
    console.log("updated state:");
    console.log(store.getState());
    console.log("changed pages:");
    console.log(getChangedPageIds(store.getState()));
    this._updateIcon(getChangedPageIds(store.getState()).length);
  }

  /**
   * Update the browserAction icon and badge text.
   *
   * @param {int} updateCount - Number of updated pages.
   */
  _updateIcon(updateCount) {
    browser.browserAction.setIcon({path: activeIcon});
    if (updateCount == 0) {
      browser.browserAction.setBadgeText({text: ''});
    } else {
      browser.browserAction.setBadgeText({text: updateCount.toString()});
    }
  }

  /**
   * If this is the first time the addon has been run, create a Page with
   * the Update Scanner website and scan it immediately.
   */
  async _checkFirstRun() {
    const config = await new Config().load();
    if (config.get('isFirstRun')) {
      store.dispatch(addPage({
        page: {
          title: 'Update Scanner Website',
          url: 'https://sneakypete81.github.io/updatescanner/',
        },
        parentId: 0,
      }));

      config.set('isFirstRun', false);
      config.set('updateVersion', latestVersion);
      await config.save();

      this._scanAll();
    }
  }

  /**
   * If the data structures aren't up to date, open the Update page to perform
   * an update.
   */
  async _checkIfUpdateRequired() {
    if (!(await isUpToDate())) {
      openUpdate();
    }
  }

  /**
   * Manual scan of all pages.
   */
  _scanAll() {
    this._scanItem(0);
  }

  /**
   * Manual scan of a single item. If the item is a PageFolder, scan all items
   * in the folder.
   *
   * @param {string} itemId - ID of the item to scan.
   */
  _scanItem(itemId) {
    const pageIds = getDescendentPageIds(store.getState(), itemId);

    log(`Pages to manually scan: ${pageIds.length}`);
    this.scanQueue.add(pageIds);
    this.scanQueue.manualScan();
  }

  /**
   * Called whenever a scan is complete.
   *
   * @param {ScanResult} result - Object containing the result of the scan.
   */
  _handleScanComplete({majorChanges, scanCount, isManualScan}) {
    log(`Scan complete, ${majorChanges} new changes.`);
    log(`${scanCount} pages scanned.`);

    // If the user has already viewed some changes, don't include in the count
    const changeCount = getChangedPageIds(store.getState()).length;
    const notifyChangeCount = Math.min(majorChanges, changeCount);

    if (notifyChangeCount > 0 || isManualScan) {
      showNotification(notifyChangeCount);
    }
  }
}
