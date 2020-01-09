import {log} from '/lib/util/log.js';
import {isMajorChange} from './fuzzy.js';
import {Page} from '../page/page.js';

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

export const __ = {
  log: (...args) => log(...args),
  isMajorChange: (...args) => isMajorChange(...args),
  changeEnum: changeEnum,
  stripHtml: stripHtml,
  getChanges: getChanges,
  getIteratorFunction: getIteratorFunction,
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
  constructor(html, parts = null) {
    this.html = html || '';
    this.parts = parts || null;
  }

}

/**
 * Detects changes based on two HTML data and page.
 *
 * @param {ContentData} prevData - Data for previous HTML.
 * @param {ContentData} scannedData - Data for scanned HTML.
 * @param {Page} page - Page.
 *
 * @returns {string|changeEnum} ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
export function getChanges(prevData, scannedData, page) {
  if (prevData.html == null || prevData.html === '') {
    return changeEnum.NEW_CONTENT;
  }

  if (page.matchCount || page.matchCount == null) {
    const countChange = getCountChange(prevData, scannedData);
    if (countChange === changeEnum.MAJOR_CHANGE) {
      return countChange;
    }
  }

  if (prevData.html === scannedData.html) {
    return changeEnum.NO_CHANGE;
  }

  const contentModeEnum = Page.contentModeEnum;
  const contentMode = page.contentMode || contentModeEnum.TEXT;
  if (contentMode === contentModeEnum.IGNORE) {
    return changeEnum.NO_CHANGE;
  }

  const prevParts = prevData.parts || [prevData.html];
  const scannedParts = scannedData.parts || [scannedData.html];

  const ignoreTags = contentMode !== contentModeEnum.HTML;

  const htmlChange = getHTMLChange(page, prevParts, scannedParts, ignoreTags);

  // If no change was detected in parts, just return minor change because we
  // already know there was a change somewhere in the html
  if (htmlChange === changeEnum.NO_CHANGE) {
    return getChangeInStrippedHtml(page, prevData.html, scannedData.html);
  } else {
    return htmlChange;
  }
}

/**
 * Returns true if prev and scanned HTML are not equal after stripping.
 *
 * @param {Page} page - Page.
 * @param {string} prevHtml - Previous HTML.
 * @param {string} scannedHtml - Scanned HTML.
 * @returns {changeEnum} True if change is detected.
 */
function getChangeInStrippedHtml(page, prevHtml, scannedHtml) {
  const ignoreTags = page.contentMode !== Page.contentModeEnum.HTML;
  const prevStrip = stripHtml(
    prevHtml,
    page.ignoreNumbers,
    ignoreTags,
  );
  const scanStrip = stripHtml(
    scannedHtml,
    page.ignoreNumbers,
    ignoreTags,
  );

  return prevStrip !== scanStrip ?
    changeEnum.MINOR_CHANGE :
    changeEnum.NO_CHANGE;
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
 * @param {Page} page - Page.
 *
 * @param {string[]} prevParts - Parts for previous HTML.
 * @param {string[]} scannedParts - Parts for scanned HTML.
 * @param {boolean} ignoreTags - Ignore tags.
 * @returns {changeEnum} - ChangeEnum string indicating how similar the
 * two HTML strings are.
 */
function getHTMLChange(page, prevParts, scannedParts, ignoreTags) {
  let maxChangeDetected = changeEnum.NO_CHANGE;
  const iterator = getIteratorFunction(page, prevParts, scannedParts);

  for (const it of iterator) {
    const prevStrip = stripHtml(
      prevParts[it.prevIndex],
      page.ignoreNumbers,
      ignoreTags,
    );
    const scanStrip = stripHtml(
      scannedParts[it.scannedIndex],
      page.ignoreNumbers,
      ignoreTags,
    );

    if (prevStrip !== scanStrip) {
      if (__.isMajorChange(prevStrip, scanStrip, page.changeThreshold)) {
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
 * Returns iterator function as specified by pages setting of match mode.
 *
 * @param {Page} page - Page.
 * @param {Array} prevParts - Parts from previous scan.
 * @param {Array} scannedParts - Parts from this scan.
 * @returns {Generator} Function for iterating over
 *   parts.
 */
function getIteratorFunction(page, prevParts, scannedParts) {
  const matchModeEnum = Page.matchModeEnum;
  const matchMode = page.matchMode || matchModeEnum.FIRST;

  let iteratorFunction;

  if (matchMode === matchModeEnum.FIRST) {
    iteratorFunction = function* (prevParts, scannedParts) {
      const length = Math.min(prevParts.length, scannedParts.length);
      for (let i = 0; i < length; i++) {
        yield {
          prevIndex: i,
          scannedIndex: i,
        };
      }
    };
  } else if (matchMode === matchModeEnum.LAST) {
    iteratorFunction = function* (prevParts, scannedParts) {
      const length = Math.min(prevParts.length, scannedParts.length);
      for (let i = length - 1; i >= 0; i--) {
        yield {
          prevIndex: i,
          scannedIndex: i,
        };
      }
    };
  } else if (matchMode === matchModeEnum.LOOKUP) {
    iteratorFunction = function* (prevParts, scannedParts) {
      const length = Math.min(prevParts.length, scannedParts.length);
      for (let i = 0; i < length; i++) {
        const index = scannedParts.indexOf(prevParts[i]);
        yield {
          // Always return valid index
          prevIndex: i,
          scannedIndex: Math.max(index, 0),
        };
      }
    };
  } else {
    __.log(`Unknown match mode ${matchMode}`);
  }

  /**
   * This callback is displayed as part of the Requester class.
   *
   * @generator
   * @function iteratorFunction
   *
   * @param {Array} prevParts - Previous parts.
   * @param {Array} scannedParts - Scanned parts.
   * @param {number} length - Integer representing length.
   * @yields {{prevIndex: number, scannedIndex: number}}
   */
  return iteratorFunction(prevParts, scannedParts);
}

/**
 * Strips whitespace, (most) scripts, tags and (optionally) numbers from the
 * input HTML.
 *
 * @param {?string} inHtml - HTML to strip.
 * @param {boolean} ignoreNumbers - True if numbers should be stripped.
 * @param {boolean} ignoreTags - True if tags should be stripped.
 *
 * @returns {object} Object containing the updated prevHtml and scannedHtml.
 */
function stripHtml(inHtml, ignoreNumbers, ignoreTags) {
  let html = inHtml;
  if (html == null) return null;

  // for proper number stripping, whitespaces need to be intact.
  if (ignoreNumbers) {
    html = stripNumbers(html);
  }

  html = stripScript(stripWhitespace(html));

  if (ignoreTags) {
    html = stripTags(html);
  }
  return html;
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with whitespace removed.
 */
function stripWhitespace(html) {
  return html.replace(/\s+/g, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with (most) scripts removed.
 */
function stripScript(html) {
  return html.replace(/<script.*?>.*?<\/script>/gi, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with tags removed.
 */
function stripTags(html) {
  return html.replace(/(<([^<]+)>)/g, '');
}

/**
 * @param {string} html - HTML to process.
 *
 * @returns {string} HTML with numbers, commas and full stops removed.
 */
function stripNumbers(html) {
  return html.replace(/([0-9]+([,.]?[0-9])?)*/g, '');
}
