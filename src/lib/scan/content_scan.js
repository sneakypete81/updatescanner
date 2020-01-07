import {log} from '/lib/util/log.js';
import {isMajorChange} from './fuzzy';

export const __ = {
  log: (...args) => log(...args),
  isMajorChange: (...args) => isMajorChange(...args),
  getChangeType: getChangeType,
  changeEnum: changeEnum,
  stripHtml: stripHtml,
};

/**
 * Enumeration indicating the similarity of two HTML strings.
 *
 * @readonly
 * @enum {string}
 */
export const changeEnum = {
  NEW_CONTENT: 'new_content',
  NO_CHANGE: 'no_change',
  MAJOR_CHANGE: 'major_change',
  MINOR_CHANGE: 'minor_change',
};

/**
 * Content data with previously prepared and chopped HTML.
 *
 * @property {string} html - Page HTML.
 * @property {?Array} parts - HTML split.
 */
export class ContentData {
  /**
   * @param {string} html - Page HTML.
   * @param {?Array} parts - HTML split.
   */
  constructor(html, parts) {
    this.html = html || '';
    this.parts = parts || null;
  }

}

/**
 * Detects changes based on two HTML data and page.
 *
 * @param {ContentData} prevData - Data for previous HTML.
 * @param {ContentData} scannedHTML - Data for scanned HTML.
 * @param {Page} page - Page.
 *
 * @returns {string|changeEnum} ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
export function getChanges(prevData, scannedHTML, page) {
  const contentMode = Math.abs(page.contentMode);
  const ignoreCount = page.contentMode < 0;

  if (contentMode === 0) {
    // count only
    return getCountChange(prevData, scannedHTML);
  } else if (contentMode === 1) {
    // html match
    return getHTMLChange(prevData, scannedHTML, ignoreCount, false, page);
  } else if (contentMode === 3) {
    // content match
    return getHTMLChange(prevData, scannedHTML, ignoreCount, true, page);
  } else {
    __.log(`Unsupported content mode ${contentMode}.`);
  }
}

/**
 * Detects change in data part count.
 *
 * @param {ContentData} prevData - Data for previous HTML.
 * @param {ContentData} scannedData - Data for scanned HTML.
 * @returns {changeEnum} - ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
function getCountChange(prevData, scannedData) {
  const prevParts = prevData.parts;
  const scannedParts = scannedData.parts;
  if (prevParts == null) {
    return (scannedParts != null) ?
      changeEnum.MAJOR_CHANGE :
      changeEnum.NO_CHANGE;
  } else if (scannedParts == null) {
    return changeEnum.MAJOR_CHANGE;
  } else {
    return (scannedParts.length !== prevParts.length) ?
      changeEnum.MAJOR_CHANGE :
      changeEnum.NO_CHANGE;
  }
}

/**
 * Detects change in HTML content.
 *
 * @param {ContentData} prevData - Data for previous HTML.
 * @param {ContentData} scannedData - Data for scanned HTML.
 * @param {boolean} ignoreCount - Ignore count of data.
 * @param {boolean} ignoreTags - Ignore tags.
 * @param {Page} page - Page.
 *
 * @returns {changeEnum} - ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
function getHTMLChange(prevData, scannedData, ignoreCount, ignoreTags, page) {
  if (!ignoreCount) {
    const countChange = getCountChange(prevData, scannedData);
    if (countChange === changeEnum.MAJOR_CHANGE) return countChange;
  }

  const prevParts = prevData.parts || [prevData.html];
  const scannedParts = scannedData.parts || [scannedData.html];
  const length = Math.min(prevParts.length, scannedParts.length);

  let maxChangeDetected = changeEnum.NO_CHANGE;

  for (let i = 0; i < length; i++) {
    const prevStrip = stripHtml(prevParts[i], page.ignoreNumbers, ignoreTags);
    const scanStrip = stripHtml(
      scannedParts[i],
      page.ignoreNumbers,
      ignoreTags,
    );

    if (prevStrip !== scanStrip) {
      if (__.isMajorChange(prevStrip, scanStrip, page.ignoreNumbers)) {
        maxChangeDetected = changeEnum.MAJOR_CHANGE;
        break;
      } else {
        maxChangeDetected = changeEnum.MINOR_CHANGE;
      }
    }
  }

  return maxChangeDetected;
}

/**
 * Given two downloaded HTML strings, return a changeEnum value indicating how
 * similar they are.
 *
 * @param {string} str1 - First HTML string for comparison.
 * @param {string} str2 - Second HTML string for comparison.
 * @param {number} changeThreshold - Number of characters that must change to
 * indicate a major change.
 *
 * @returns {string} ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
function getChangeType(str1, str2, changeThreshold) {
  if (str1 === null) {
    // This is the first scan.
    return changeEnum.NEW_CONTENT;
  } else if (str1 === str2) {
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
 * @param {boolean} ignoreNumbers - True if numbers should be stripped.
 * @param {boolean} ignoreTags - True if tags should be stripped.
 *
 * @returns {object} Object containing the updated prevHtml and scannedHtml.
 */
function stripHtml(prevHtml, ignoreNumbers, ignoreTags) {
  let html = stripScript(stripWhitespace(prevHtml));
  if (ignoreTags) {
    html = stripTags(html);
  }
  if (ignoreNumbers) {
    html = stripNumbers(html);
  }
  return html;
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
 * @returns {string} HTML with (most) scripts removed.
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
