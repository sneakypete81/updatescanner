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
  qs('#title').textContent = 'Debug Info: ' + page.title;
  qs('#html-old').textContent = oldHtml;
  qs('#html-new').textContent = newHtml;
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
