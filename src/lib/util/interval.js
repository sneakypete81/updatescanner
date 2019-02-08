import {waitForMs} from '/lib/util/promise.js';
import {log} from '/lib/util/log.js';

/**
 * Sets default scan interval on first run (2000 milliseconds).
 */
export async function saveScanFirstRun() {
  try {
    await browser.storage.local.set({'gimmeinterval': 2000});
    // Short delay to avoid that error or something that pops up in the console.
    await waitForMs(100);
  } catch (error) {
    console.log(`ERROR: Interval.save: ${error}`);
  }
}

/**
 * Saves the scan interval.
 *
 * @param {int} passthis - The time to wait between scans in seconds.
 */
 export async function saveScanInterval(passthis) {
    // Convert to milliseconds.
    const tempInterval = 1000*parseInt(passthis, 10);

    // If given time is lower than 2 seconds, set to 2 seconds.
    try {
      if (tempInterval >= 2000) {
        await browser.storage.local.set({'gimmeinterval': tempInterval});
      } else {
      await browser.storage.local.set({'gimmeinterval': 2000});
      }
      // Short delay to avoid that one error or something.
      await waitForMs(100);
      window.close();
    } catch (error) {
      console.log(`ERROR: Interval.save: ${error}`);
    }
}

/**
 * Gets the scan interval.
 *
 * @returns {int} The time to wait between scans in milliseconds.
 */
 export async function loadScanInterval() {
    try {
      const interval = await browser.storage.local.get('gimmeinterval');
      log('Time to wait in ms between scans: '+interval.gimmeinterval);
      // Short delay to avoid that one error or something.
      await waitForMs(100);
      return (parseInt(interval.gimmeinterval));

    } catch (error) {
      console.log(`ERROR: Interval.load: ${error}`);
    }
 }
