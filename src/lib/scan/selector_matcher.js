import {log} from '/lib/util/log.js';

export const __ = {
  log: (...args) => log(...args),
  matchHtmlWithSelector: matchHtmlWithSelector,
};

/**
 * Matches html based on selector and returns array of matches.
 *
 * @param {string} html - HTML structure.
 * @param {string} selector - Regex selector (supports classes,
 * ids and indexes).
 *
 * @returns {Array<string>} - Array of matches. If syntax error occurs, array
 *   with original HTML is returned.
 */
export async function matchHtmlWithSelector(html, selector) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const matches = dom.querySelectorAll(selector);
  const result = [];
  matches.forEach((element) => result.push(element.outerHTML));
  return result;
}
