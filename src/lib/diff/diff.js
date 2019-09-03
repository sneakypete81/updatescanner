import {highlightDiffs} from './diff_engine.js';

/**
 * Perform a diff between two HTML strings, returning highlighted HTML.
 *
 * @param {string} oldHtml - Old HTML string to use for comparison.
 * @param {string} newHtml - New HTML string to use for comparison.
 *
 * @returns {string} Highlighted HTML string.
 */
export function diff(oldHtml, newHtml) {
  return highlightDiffs(oldHtml, newHtml, '#ffff66', '', '');
}
