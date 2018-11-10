import {isMajorChange} from './fuzzy.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {isUpToDate} from '/lib/update/update.js';
import {log} from '/lib/util/log.js';
import {waitForMs} from '/lib/util/promise.js';
import {detectEncoding, applyEncoding} from '/lib/util/encoding.js';

/**
 * Enumeration indicating the similarity of two HTML strings.
 * @readonly
 * @enum {string}
 */
const changeEnum = {
  NEW_CONTENT: 'new_content',
  NO_CHANGE: 'no_change',
  MAJOR_CHANGE: 'major_change',
  MINOR_CHANGE: 'minor_change',
};

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
  detectEncoding: (...args) => detectEncoding(...args),
  applyEncoding: (...args) => applyEncoding(...args),
  isMajorChange: (...args) => isMajorChange(...args),
  waitForMs: (...args) => waitForMs(...args),
  isUpToDate: (...args) => isUpToDate(...args),

  // Allow private functions to be tested
  changeEnum: changeEnum,
  getChangeType: getChangeType,
  updatePageState: updatePageState,
  stripHtml: stripHtml,
  getHtmlFromResponse: getHtmlFromResponse,
};

// Wait between scanning pages
const SCAN_IDLE_MS = 2000;

/**
 * Start scanning the pages one at a time. HTML is checked for updates and
 * saved to the PageStore, and the Page objects updated and saved accordingly.
 *
 * @param {Array.<Page>} pageList - Array of pages to scan.
 *
 * @returns {integer} The number of new major changes detected.
 */
export async function scan(pageList) {
  let newMajorChangeCount = 0;
  for (const page of pageList) {
    if (await scanPage(page)) {
      newMajorChangeCount++;
    }

    await __.waitForMs(SCAN_IDLE_MS);
  }
  return newMajorChangeCount;
}

/**
 * Scan a single page, check for updates, then save the HTML to the PageStore
 * and updating and save the Page object accordingly. Errors are logged and
 * ignored.
 *
 * @param {Page} page - Page to scan.
 *
 * @returns {boolean} True if a new major change is detected.
 */
export async function scanPage(page) {
  // Don't scan if the data structures aren't yet updated to the latest version
  if (!(await __.isUpToDate())) {
    return false;
  }
  if (!page) {
    return false;
  }
  __.log(`Scanning "${page.title}"...`);
  try {
    const response = await fetch(page.url);
    if (!response.ok) {
      throw Error(`[${response.status}] ${response.statusText}`);
    }

    const html = await getHtmlFromResponse(response, page);
    return processHtml(page, html);

  } catch (error) {
    __.log(`Could not scan "${page.title}": ${error}`);
    // Only save if the page still exists
    if (await page.existsInStorage()) {
      page.state = Page.stateEnum.ERROR;
      page.save();
    }
  }
  return false;
}

/**
 * Given an HTTP Response, extract the HTML and apply character encoding.
 * If the page encoding attribute is not set, autodetect it and update the page.
 *
 * @param {Response} response - HTTP response.
 * @param {Page} page - Page object associated with the scan.
 *
 * @returns {string} HTML page content.
 */
async function getHtmlFromResponse(response, page) {
  // This is probably faster for the most common case (utf-8)
  if (page.encoding == 'utf-8') {
    return await response.text();
  }

  const buffer = await response.arrayBuffer();

  if (page.encoding === null || page.encoding == 'auto') {
    const rawHtml = __.applyEncoding(buffer, 'utf-8');
    page.encoding = __.detectEncoding(response.headers, rawHtml);
    page.save();
  }
  return __.applyEncoding(buffer, page.encoding);
}

/**
 * Load the "NEW" HTML from storage, compare it with the the scanned HTML,
 * update the page state and update the HTML storage as necessary. Returns
 * without waiting for the save operations to complete.
 * Note that the "NEW" HTML is used for comparison - this is the HTML that was
 * downloaded during the most recent scan. This is the simplest and most
 * resource-efficient approach.
 *
 * @param {Page} page - Page object to update.
 * @param {string} scannedHtml - HTML to process.
 *
 * @returns {boolean} True if a new major change is detected.
 */
async function processHtml(page, scannedHtml) {
  // Do nothing if the page no longer exists
  const existsInStorage = await page.existsInStorage();
  if (!existsInStorage) {
    return false;
  }

  const prevHtml = await PageStore.loadHtml(page.id, PageStore.htmlTypes.NEW);
  return await updatePageState(page, prevHtml, scannedHtml);
}

/**
 * Compare the scanned HTML with the "NEW" HTML from storage, update the page
 * state and save the HTML to storage. The method returns without waiting for
 * the save operations to complete.
 *
 * @param {Page} page - Page object to update.
 * @param {string} prevHtml - HTML from storage.
 * @param {string} scannedHtml - Scanned HTML to process.
 *
 * @returns {boolean} True if a new major change is detected.
 */
async function updatePageState(page, prevHtml, scannedHtml) {
  const stripped = stripHtml(prevHtml, scannedHtml, page.ignoreNumbers);

  const changeType = getChangeType(stripped.prevHtml, stripped.scannedHtml,
    page.changeThreshold);

  if (changeType == changeEnum.MAJOR_CHANGE) {
    if (!page.isChanged()) {
      // This is a newly detected change, so update the old HTML.
      PageStore.saveHtml(page.id, PageStore.htmlTypes.OLD, prevHtml);
      page.oldScanTime = page.newScanTime;
    }
    PageStore.saveHtml(page.id, PageStore.htmlTypes.NEW, scannedHtml);
    page.state = Page.stateEnum.CHANGED;
  } else {
    PageStore.saveHtml(page.id, PageStore.htmlTypes.NEW, scannedHtml);
    // Only update the state if not previously marked as changed.
    if (!page.isChanged()) {
      page.state = Page.stateEnum.NO_CHANGE;
    }
  }

  page.newScanTime = Date.now();

  await page.save();
  return changeType == changeEnum.MAJOR_CHANGE;
}

/**
 * Given two downloaded HTML strings, return a changeEnum value indicating how
 * similar they are.
 *
 * @param {string} str1 - First HTML string for comparison.
 * @param {string} str2 - Second HTML string for comparison.
 * @param {integer} changeThreshold - Number of characters that must change to
 * indicate a major change.
 *
 * @returns {string} ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
function getChangeType(str1, str2, changeThreshold) {
  if (str1 === null) {
    // This is the first scan.
    return changeEnum.NEW_CONTENT;
  } else if (str1 == str2) {
    // HTML is unchanged.
    return changeEnum.NO_CHANGE;
  } else if (__.isMajorChange(str1, str2, changeThreshold)) {
    // Change is larger than changeThreshold.
    return changeEnum.MAJOR_CHANGE;
  } else {
    // Change is smaller than changeThreshold.
    return changeEnum.MINOR_CHANGE;
  }
}

/**
 * Strips whitespace, (most) scripts, tags and (optionally) numbers from the
 * input HTML.
 *
 * @param {string} prevHtml - HTML from storage.
 * @param {string} scannedHtml - Scanned HTML to process.
 * @param {boolean} ignoreNumbers - True if numbers should be stripped.
 *
 * @returns {Object} Object containing the updated prevHtml and scannedHtml.
 */
function stripHtml(prevHtml, scannedHtml, ignoreNumbers) {
  prevHtml = stripTags(stripScript(stripWhitespace(prevHtml)));
  scannedHtml = stripTags(stripScript(stripWhitespace(scannedHtml)));
  if (ignoreNumbers) {
    prevHtml = stripNumbers(prevHtml);
    scannedHtml = stripNumbers(scannedHtml);
  }
  return {prevHtml: prevHtml, scannedHtml: scannedHtml};
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with whitespace removed.
 */
function stripWhitespace(html) {
  if (html === null) {
    return null;
  }
  return html.replace(/\s+/g, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with (most) sctipts removed.
 */
function stripScript(html) {
  if (html === null) {
    return null;
  }
  return html.replace(/<script.*?>.*?<\/script>/gi, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with tags removed.
 */
function stripTags(html) {
  if (html === null) {
    return null;
  }
  return html.replace(/(<([^<]+)>)/g, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with numbers, commas and full stops removed.
 */
function stripNumbers(html) {
  if (html === null) {
    return null;
  }
  return html.replace(/[0-9,.]*/g, '');
}
