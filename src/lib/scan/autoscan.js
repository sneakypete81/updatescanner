import {scan} from 'scan/scan';
import {PageStore} from 'page/page_store';
import {Config} from 'util/config';

const ALARM_ID = 'updatescanner-autoscan';
const ALARM_TIMING = {delayInMinutes: 1, periodInMinutes: 5};
const DEBUG_ALARM_TIMING = {delayInMinutes: 0.1, periodInMinutes: 0.5};

/**
 * Starts the Autoscanner.
 *
 * @returns {Promise} Empty promise that resolves when initialisation is
 * complete.
 */
export function start() {
  return Config.loadSingleSetting('debug').then((debug) => {
    stopAlarm();
    startAlarm(debug);
    browser.alarms.onAlarm.addListener(
      (alarm) => onAlarm(alarm));
  });
}

/**
 * Start the Autoscanner alarm.
 *
 * @param {boolean} debug - Whether to use shorter debug timings.
 */
function startAlarm(debug) {
  const timing = debug ? DEBUG_ALARM_TIMING : ALARM_TIMING;
  browser.alarms.create(ALARM_ID, timing);
}

/**
 * Stop the Autoscanner alarm.
 */
function stopAlarm() {
  browser.alarms.clear(ALARM_ID);
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
function onAlarm(alarm) {
  if (alarm.name == ALARM_ID) {
    return loadPageList().then((pageList) => {
      const scanList = getScanList(pageList);
      if (scanList.length > 0) {
        console.log('Pages to autoscan: ' + scanList.length);
        scan(scanList).then(() => {
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
function loadPageList() {
  return PageStore.load().then(
    (pageStore) => pageStore.getPageList());
}

/**
 * Determine which pages need to be scanned.
 *
 * @param {Array.<Page|PageFolder>} pageList - List of Pages/PageFolders
 * loaded from storage.
 *
 * @returns {Array.<Page>} List of Page objects that need scanning.
 */
function getScanList(pageList) {
  let scanList = [];
  for (const item of pageList) {
    if (isAutoscanPending(item)) {
      scanList.push(item);
      item.lastAutoscanTime = Date.now();
      item.save();
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
function isAutoscanPending(page) {
  if (page.lastAutoscanTime === undefined) {
    return true;
  }
  const timeSinceLastAutoscan = Date.now() - page.lastAutoscanTime;
  return (timeSinceLastAutoscan >= page.scanRateMinutes * 60 * 1000);
}

// Allow private functions to be tested
export const __ = {
  onAlarm: onAlarm,
  isAutoscanPending: isAutoscanPending,
};
