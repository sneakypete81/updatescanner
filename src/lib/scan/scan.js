import {isMajorChange} from 'scan/fuzzy';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {log} from 'util/log';

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
async function scanPage(page) {
  log(`Scanning "${page.title}"...`);
  try {
    const response = await fetch(page.url);
    if (!response.ok) {
      throw Error(`[${response.status}] ${response.statusText}`);
    }

    const html = await response.text();
    return processHtml(page, html);
  } catch (error) {
    log(`Could not scan "${page.title}": ${error}`);
    page.error = true;
    page.errorMessage = error.toString();
  }
  return false;
}

/**
 * Load the "NEW" HTML from storage, compare it with the the scanned HTML,
 * update the page state and update the HTML storage as necessary. returns
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

  let isNewMajorChange = false;
  switch (getChangeType(
    stripped.prevHtml, stripped.scannedHtml, page.changeThreshold
  )) {
    case changeEnum.NEW_CONTENT:
    case changeEnum.MINOR_CHANGE:
      PageStore.saveHtml(page.id, PageStore.htmlTypes.NEW, scannedHtml);
      // Only update the state if not previously marked as changed.
      if (page.state != Page.stateEnum.CHANGED) {
        page.state = Page.stateEnum.NO_CHANGE;
      }
      break;

    case changeEnum.MAJOR_CHANGE:
      if (page.state != Page.stateEnum.CHANGED) {
        isNewMajorChange = true;
        // This is a newly detected change, so update the old HTML.
        PageStore.saveHtml(page.id, PageStore.htmlTypes.OLD, prevHtml);
        page.oldScanTime = page.newScanTime;
      }
      PageStore.saveHtml(page.id, PageStore.htmlTypes.NEW, scannedHtml);
      page.state = Page.stateEnum.CHANGED;
      break;

    case changeEnum.NO_CHANGE:
      // Only update the state if not previously marked as changed.
      if (page.state != Page.stateEnum.CHANGED) {
        page.state = Page.stateEnum.NO_CHANGE;
      }
      break;
  }
  page.newScanTime = Date.now();
  page.error = false;
  page.errorMessage = '';

  await page.save();
  return isNewMajorChange;
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
  } else if (isMajorChange(str1, str2, changeThreshold)) {
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

// Allow private functions to be tested
export const __ = {
  changeEnum: changeEnum,
  getChangeType: getChangeType,
  updatePageState: updatePageState,
  stripHtml: stripHtml,
};
