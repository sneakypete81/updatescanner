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
   */
  static _onAlarm(alarm) {
    if (alarm.name == Autoscan.ALARM_ID) {
      PageStore.load().then((pageStore) => {
        const pageList = Autoscan._getScanList(pageStore);

        console.log('Scanning ' + pageList.length + ' pages.');
        new Scan(pageList).start().then(() => {
          console.log('Autoscan complete.');
        });
      });
    }
  }

  /**
   * Determine which pages need to be scanned.
   *
   * @param {PageStore} pageStore - PageStore object loaded from storage.
   *
   * @returns {Array.<Page>} List of Page objects that need scanning.
   */
  static _getScanList(pageStore) {
    let pageList = [];
    for (const page of pageStore.pageMap.values()) {
      if (page instanceof Page && Autoscan._isAutoscanPending(page)) {
        pageList.push(page);
      }
    }
    return pageList;
  }

  /**
   */
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
