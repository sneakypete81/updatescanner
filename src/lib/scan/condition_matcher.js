import {log} from '/lib/util/log.js';

/**
 *
 * @param {string} condition - Condition
 * @param {string} startFrom - Index from which to start
 */
function nextPart(condition, startFrom) {
  for (let i = startFrom; i < condition.length; i++) {
    const char = condition[i];
    if (char == '.' || char == '#' || char == '[') {
      return i;
    }
  }
  return condition.length;
}

/**
 * Matches html based on condition and returns array of matches.
 *
 * @param {string} html - HTML structure.
 * @param {string} condition - Regex condition (supports classes,
 * ids and indexes).
 *
 * @returns {Array} - Array of matches.
 */
export async function matchHtmlWithCondition(html, condition) {
  let i = 0;
  const length = condition.length;

  while (i < length) {
    const startAt = i + 1;
    const nextIndex = nextPart(condition, startAt);
    const type = condition[i];

    if (type == '.') {
      const className = condition.substring(startAt, nextIndex - startAt + 1);

      const matches = html.matchAll(
        `(?=<[^>]+(?=[\\s+\\"\\']${className}[\\s+\\"\\']).+)([^>]+>)`,
        'g',
      );
      const result = [];

      for (const match of matches) {
        result.push(match.index);
      }

      return result;
    } else if (type == '#') {
    } else if (type == '[') {
    } else {
      return html;
    }

    i = nextIndex;
  }
}
