import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {isUpToDate} from '/lib/update/update.js';
import {log} from '/lib/util/log.js';
import {waitForMs} from '/lib/util/promise.js';
import {applyEncoding, detectEncoding} from '/lib/util/encoding.js';
import {matchHtmlWithCondition} from './condition_matcher.js';
import {getChanges, ContentData, changeEnum} from './content_scan';


// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
  detectEncoding: (...args) => detectEncoding(...args),
  applyEncoding: (...args) => applyEncoding(...args),
  waitForMs: (...args) => waitForMs(...args),
  isUpToDate: (...args) => isUpToDate(...args),

  // Allow private functions to be tested
  updatePageState: updatePageState,
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
 * @returns {number} The number of new major changes detected.
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
      const updatedPage = await Page.load(page.id);
      updatedPage.state = Page.stateEnum.ERROR;
      updatedPage.save();
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
  if (page.encoding === 'utf-8') {
    return await response.text();
  }

  const buffer = await response.arrayBuffer();

  if (page.encoding == null || page.encoding === 'auto') {
    const rawHtml = __.applyEncoding(buffer, 'utf-8');
    const updatedPage = await Page.load(page.id);
    updatedPage.encoding = __.detectEncoding(response.headers, rawHtml);
    updatedPage.save();
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

  return processHtmlWithConditions(page, scannedHtml, prevHtml);
}

/**
 * Processes HTML with conditions specified in page settings. If conditions
 * do not exist or page was not scanned yet standard update is called.
 *
 * @param {Page} page - Page object to update.
 * @param {string} scannedHtml - HTML to process.
 * @param {string} prevHtml - Previous HTML.
 *
 * @returns {boolean} True if a new major change is detected.
 */
async function processHtmlWithConditions(page, scannedHtml, prevHtml) {
  if (page.conditions && prevHtml != null) {
    const conditionsSplit = page.conditions.replace(' ', '').split(',');
    const never = new Promise(() => {
    });

    const somePromise = (promises) =>
      Promise.race([
        Promise.race(promises.map(async (p) => !!(await p) || never)),
        Promise.all(promises).then((r) => r.some(Boolean)),
      ]);

    const promises = conditionsSplit.map(async (value) => {
      const scannedParts = await matchHtmlWithCondition(scannedHtml, value);
      const prevParts = await matchHtmlWithCondition(prevHtml, value);
      return updatePageState(
        page,
        new ContentData(prevHtml, prevParts),
        new ContentData(scannedHtml, scannedParts),
      );
    });
    return await somePromise(promises);
  } else {
    return updatePageState(
      page,
      new ContentData(prevHtml, null),
      new ContentData(scannedHtml, null),
    );
  }
}

/**
 * Compare the scanned HTML with the "NEW" HTML from storage, update the page
 * state and save the HTML to storage. The method returns without waiting for
 * the save operations to complete.
 *
 * @param {Page} page - Page object to update.
 * @param {ContentData} prevHtmlData - HTML from storage.
 * @param {ContentData} scannedHtmlData - Scanned HTML to process.
 *
 * @returns {boolean} True if a new major change is detected.
 */
async function updatePageState(page, prevHtmlData, scannedHtmlData) {
  const updatedPage = await Page.load(page.id);

  const changeType = getChanges(
    prevHtmlData,
    scannedHtmlData,
    updatedPage.changeThreshold,
  );

  if (changeType === changeEnum.MAJOR_CHANGE) {
    if (!updatedPage.isChanged()) {
      // This is a newly detected change, so update the old HTML.
      await PageStore
        .saveHtml(updatedPage.id, PageStore.htmlTypes.OLD, prevHtmlData.html);
      updatedPage.oldScanTime = updatedPage.newScanTime;
    }
    await PageStore
      .saveHtml(updatedPage.id, PageStore.htmlTypes.NEW, scannedHtmlData.html);
    updatedPage.state = Page.stateEnum.CHANGED;
  } else {
    await PageStore
      .saveHtml(updatedPage.id, PageStore.htmlTypes.NEW, scannedHtmlData.html);
    // Only update the state if not previously marked as changed.
    if (!updatedPage.isChanged()) {
      updatedPage.state = Page.stateEnum.NO_CHANGE;
    }
  }

  updatedPage.newScanTime = Date.now();

  await updatedPage.save();
  return changeType === changeEnum.MAJOR_CHANGE;
}
