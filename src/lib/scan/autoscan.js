import {Scan} from './scan';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {Config} from 'util/config';

/**
 * Static functions to handle the automatic scanning of webpages.
 */
export class Autoscan {

  /**
   * @returns {string} ID for the Autoscanner alarm.
   */
  static get _ALARM_ID() {
    return 'updatescanner-autoscan';
  }

  /**
   * @returns {Object} Timing object for the Autoscanner alarms.
   */
  static get _ALARM_TIMING() {
    return {delayInMinutes: 1, periodInMinutes: 5};
  }

  /**
   * @returns {Object} Timing object for the Autoscanner alarms in debug mode.
   */
  static get _DEBUG_ALARM_TIMING() {
    return {delayInMinutes: 0.1, periodInMinutes: 0.5};
  }

  /**
   * Initialise the Autoscanner.
   *
   * @returns {Promise} Empty promise that resolves when initialisation is
   * complete.
   */
  static init() {
    return Config.loadSingleSetting('debug').then((debug) => {
      Autoscan._stopAlarm();
      Autoscan._startAlarm(debug);
      browser.alarms.onAlarm.addListener(
        (alarm) => Autoscan._onAlarm(alarm));
    });
  }

  /**
   * Start the Autoscanner alarm.
   *
   * @param {boolean} debug - Whether to use shorter debug timings.
   */
  static _startAlarm(debug) {
    const timing = debug ? Autoscan._DEBUG_ALARM_TIMING
                         : Autoscan._ALARM_TIMING;
    browser.alarms.create(Autoscan._ALARM_ID, timing);
  }

  /**
   * Stop the Autoscanner alarm.
   */
  static _stopAlarm() {
    browser.alarms.clear(Autoscan._ALARM_ID);
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
    if (alarm.name == Autoscan._ALARM_ID) {
      return Autoscan._loadPageList().then((pageList) => {
        const scanList = Autoscan._getScanList(pageList);
        if (scanList.length > 0) {
          console.log('Pages to autoscan: ' + scanList.length);
          Scan.scan(scanList).then(() => {
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
}
