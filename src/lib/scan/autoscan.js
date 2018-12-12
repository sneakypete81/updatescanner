import {Config} from '/lib/util/config.js';
import {log} from '/lib/util/log.js';

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),

  // Allow private functions to be tested
  isAutoscanPending: isAutoscanPending,
};

const ALARM_ID = 'updatescanner-autoscan';
const ALARM_TIMING = {delayInMinutes: 1, periodInMinutes: 5};
const DEBUG_ALARM_TIMING = {delayInMinutes: 0.1, periodInMinutes: 0.5};

/**
 * Class to automatically scan pages on a schedule.
 */
export class Autoscan {
  /**
   * @param {ScanQueue} scanQueue - ScanQueue object to use for scanning.
   * @param {PageStore} pageStore - PageStore object to use for scanning.
   */
  constructor(scanQueue, pageStore) {
    this._scanQueue = scanQueue;
    this._pageStore = pageStore;
  }

  /**
   * Starts the Autoscanner.
   */
  async start() {
    const debug = await Config.loadSingleSetting('debug');
    if (debug) {
      __.log('Debug enabled - using fast scan times.');
    }

    await stopAlarm();
    startAlarm(debug);
    browser.alarms.onAlarm.addListener((alarm) => this.onAlarm(alarm));
  }

  /**
   * Callback for when the Autoscanner alarm expires. Checks if any pages need
   * scanning.
   *
   * @param {type} alarm - Alarm object that expired.
   */
  onAlarm(alarm) {
    if (alarm.name != ALARM_ID) {
      return;
    }

    const scanList = getScanList(this._pageStore.getPageList());
    if (scanList.length > 0) {
      __.log(`Pages to autoscan: ${scanList.length}`);
      this._scanQueue.add(scanList);
      this._scanQueue.scan();
    }
  }
}

/**
 * Start the Autoscanner alarm.
 *
 * @param {boolean} debug - Whether to use shorter debug timings.
 */
function startAlarm(debug) {
  const timing = debug ? DEBUG_ALARM_TIMING : ALARM_TIMING;
  browser.alarms.create(ALARM_ID, timing);
  if (debug) {
    __.log(`Created alarm with timing delay=${timing.delayInMinutes} mins, ` +
      `period=${timing.periodInMinutes} mins`);
  }
}

/**
 * Stop the Autoscanner alarm.
 */
async function stopAlarm() {
  await browser.alarms.clear(ALARM_ID);
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
  const scanList = [];
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
  if (page.scanRateMinutes == 0) {
    // Autoscanning is disabled for this page
    return false;
  }
  if (page.lastAutoscanTime === null) {
    return true;
  }
  const timeSinceLastAutoscan = Date.now() - page.lastAutoscanTime;
  return (timeSinceLastAutoscan >= page.scanRateMinutes * 60 * 1000);
}
