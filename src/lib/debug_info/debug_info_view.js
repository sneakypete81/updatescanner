import {$on, qs} from '/lib/util/view_helpers.js';
import {waitForMs} from '/lib/util/promise.js';

/**
 * @param {Object} handlers - Object containing the following keys
 * downloadOldHandler - Called when the Old HTML Download button is clicked
 * downloadNewHandler - Called when the New HTML Download button is clicked.
 */
export function bind({downloadOldHandler, downloadNewHandler}) {
  $on(qs('#download-old'), 'click', downloadOldHandler);
  $on(qs('#download-new'), 'click', downloadNewHandler);
}

/**
 * Show the debug info from the specified page.
 *
 * @param {Page} page - Page object to display.
 * @param {string} oldHtml - Old HTML data to display.
 * @param {string} newHtml - New HTML data to display.
 */
export function update(page, oldHtml, newHtml) {
  qs('#title').textContent = `${page.title} - Debug Info`;
  qs('#details').textContent = formatDetails(page);
  qs('#html-old').textContent = oldHtml;
  qs('#html-new').textContent = newHtml;
}

/**
 * Returns a string containing preformatted Page attributes.
 *
 * @param {Page} page - Page object to format.
 *
 * @returns {string} String containing preformatted Page attributes.
 */
function formatDetails(page) {
  const lastAutoscanTime = page.lastAutoscanTime ?
    new Date(page.lastAutoscanTime).toString() : null;
  const oldScanTime = page.oldScanTime ?
    new Date(page.oldScanTime).toString() : null;
  const newScanTime = page.newScanTime ?
    new Date(page.newScanTime).toString() : null;

  return `${page.url}
scanRateMinutes:  ${page.scanRateMinutes}
changeThreshold:  ${page.changeThreshold}
ignoreNumbers:    ${page.ignoreNumbers}
encoding:         ${page.encoding}
highlightChanges: ${page.highlightChanges}
highlightColour:  ${page.highlightColour}
markChanges:      ${page.markChanges}
doPost:           ${page.doPost}
postParams:       ${page.postParams}
state:            ${page.state}
lastAutoscanTime: ${lastAutoscanTime}
oldScanTime:      ${oldScanTime}
newScanTime:      ${newScanTime}`;
}

/**
 * Download a Url object. Awaits until the click event has fired, so it's safe
 * to release the ObjectURL.
 *
 * @param {Url} url - Url object to download.
 * @param {string} filename - Default filename for the download.
 */
export async function downloadUrl(url, filename) {
  const link = qs('#download-link');
  link.href = url;
  link.download = filename;
  link.click();

  await waitForMs(0);
}
