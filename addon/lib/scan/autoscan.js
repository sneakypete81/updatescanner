/* exported Autoscan */
/* global Scan, PageStore, Page */

/**
 * Static functions to handle the automatic scanning of webpages.
 */
class Autoscan {

  /**
   * @returns {string} ID for the Autoscanner alarm.
   */
  static get ALARM_ID() {
    return 'updatescanner-autoscan';
  }

  /**
   * @returns {Object} Timing object for the Autoscanner alarms.
   */
  static get ALARM_TIMING() {
    // @TODO: Configure this with a dev flag preference
    return {delayInMinutes: 0.1, periodInMinutes: 0.5};
  }

  /**
   * Initialise the Autoscanner.
   */
  static init() {
    Autoscan._stopAlarm();
    Autoscan._startAlarm();
    browser.alarms.onAlarm.addListener((alarm) => Autoscan._onAlarm(alarm));
  }

  /**
   * Start the Autoscanner alarm.
   */
  static _startAlarm() {
    browser.alarms.create(Autoscan.ALARM_ID, Autoscan.ALARM_TIMING);
  }

  /**
   * Stop the Autoscanner alarm.
   */
  static _stopAlarm() {
    browser.alarms.clear(Autoscan.ALARM_ID);
  }

  /**
   * Callback for when the Autoscanner alarm expires. Checks if any pages need
   * scanning.
   *
   * @param {type} alarm - Alarm object that expired.
   *
   * @returns {Promise} A Promise that resolves when the autoscan is
   * complete. This will be ignored by the caller, but is useful for testing..
   */
  static _onAlarm(alarm) {
    if (alarm.name == Autoscan.ALARM_ID) {
      return Autoscan._loadPageList().then((pageList) => {
        const scanList = Autoscan._getScanList(pageList);
        if (scanList.length > 0) {
          console.log('Pages to autoscan: ' + scanList.length);
          Autoscan._startScan(scanList).then(() => {
            console.log('Autoscan complete.');
          });
        }
      });
    }
  }

  /**
   * Load the list of pages from storage.
   *
   * @returns {Promise} A promise that returns the full list of Pages
   * (and PageFolders).
   */
  static _loadPageList() {
    return PageStore.load().then((pageStore) => pageStore.pageMap.values());
  }

  /**
   * Determine which pages need to be scanned.
   *
   * @param {Array.<Page|PageFolder>} pageList - List of Pages/PageFolders
   * loaded from storage.
   *
   * @returns {Array.<Page>} List of Page objects that need scanning.
   */
  static _getScanList(pageList) {
    let scanList = [];
    for (const page of pageList) {
      if (page instanceof Page && Autoscan._isAutoscanPending(page)) {
        scanList.push(page);
      }
    }
    return scanList;
  }

  /**
   * Determine whether it's time to autoscan a page.
   *
   * @param {Page} page - Page to check.
   *
   * @returns {boolean} True if it's time to autoscan the page.
   */
  static _isAutoscanPending(page) {
    if (page.lastAutoscanTime === undefined) {
      return true;
    }
    const timeSinceLastAutoscan = Date.now() - page.lastAutoscanTime;
    return (timeSinceLastAutoscan >= page.scanRateMinutes * 60 * 1000);
  }

  /**
   * Start scanning a list of pages.
   *
   * @param {Array.<Page>} scanList - List of pages to scan.
   *
   * @returns {Promise} An empty promise that fulfills once all pages have been
   * scanned and updated.
   */
  static _startScan(scanList) {
    return new Scan(scanList).start();
  }
}
