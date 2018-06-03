import {backgroundActionEnum} from './actions.js';
import {Autoscan} from '/lib/scan/autoscan.js';
import {ScanQueue} from '/lib/scan/scan_queue.js';
import {showNotification} from '/lib/scan/notification.js';
import {PageStore, hasPageStateChanged, isItemChanged}
  from '/lib/page/page_store.js';
import {isUpToDate, latestVersion} from '/lib/update/update.js';
import {openUpdate} from '/lib/update/update_url.js';
import {log} from '/lib/util/log.js';
import {Config} from '/lib/util/config.js';

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
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   */
  constructor() {
    this.pageStore = null;
    this.scanQueue = null;
  }

  /**
   * Start the background processes and listeners.
   */
  async init() {
    this.pageStore = await PageStore.load();
    this.pageStore.bindPageUpdate(this._handlePageUpdate.bind(this));
    browser.runtime.onMessage.addListener(this._handleMessage.bind(this));

    this.scanQueue = new ScanQueue();
    this.scanQueue.bindScanComplete(this._handleScanComplete.bind(this));

    this._refreshIcon();
    this.pageStore.refreshFolderState();
    await this._checkFirstRun();
    await this._checkIfUpdateRequired();

    const autoscan = new Autoscan(this.scanQueue, this.pageStore);
    autoscan.start();
  }

  /**
   * Called when a Page is updated in Storage. Refresh the icon if its state
   * changed.
   *
   * @param {string} pageId - ID of the changed Page.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  _handlePageUpdate(pageId, change) {
    if (hasPageStateChanged(change)) {
      this._refreshIcon();
      this.pageStore.refreshFolderState();
    }
  }

  /**
   * Called when a message is sent to the background process.
   *
   * @param {Object} message - Message content.
   */
  _handleMessage(message) {
    if (message.action == backgroundActionEnum.SCAN_ALL) {
      this._scanAll();
    } else if (message.action == backgroundActionEnum.SCAN_ITEM) {
      this._scanItem(message.itemId);
    }
  }

  /**
   * Refresh the browserAction icon and badge text.
   */
  _refreshIcon() {
    const updateCount = this.pageStore.getPageList()
      .filter(isItemChanged).length;

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
      const page = await this.pageStore.createWebsitePage();
      config.set('isFirstRun', false);
      config.set('updateVersion', latestVersion);
      await config.save();

      this.scanQueue.add([page]);
      this.scanQueue.scan();
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
   * Manual scan of all Pages in the PageStore.
   */
  _scanAll() {
    this._scanItem(PageStore.ROOT_ID);
  }

  /**
   * Manual scan of a single item. If the item is a PageFolder, scan all items
   * in the folder.
   *
   * @param {string} itemId - ID of the item to scan.
   */
  _scanItem(itemId) {
    const scanList = this.pageStore.getDescendantPages(itemId);

    log(`Pages to manually scan: ${scanList.length}`);
    this.scanQueue.add(scanList);
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
    const changeCount = this.pageStore.getChangedPageList().length;
    const notifyChangeCount = Math.min(majorChanges, changeCount);

    if (notifyChangeCount > 0 || isManualScan) {
      showNotification(notifyChangeCount);
    }
  }
}
