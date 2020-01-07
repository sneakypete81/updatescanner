import {log} from '/lib/util/log.js';

export const __ = {
  log: (...args) => log(...args),
};

/**
 * Finds next part of an condition. Supports dots, hashes and square brackets.
 *
 * @param {string} condition - Condition.
 * @param {number} startFrom - Index from which to start.
 *
 * @returns {number} Index of next supported symbol.
 */
function nextPart(condition, startFrom) {
  for (let i = startFrom; i < condition.length; i++) {
    const char = condition[i];
    if (char === '.' || char === '#' || char === '[') {
      return i;
    }
  }
  return condition.length;
}

/**
 * Substrings value of conditions part.
 *
 * @param {string} condition - Condition.
 * @param {number} startAtIndex - Start index of condition part.
 * @param {number} nextIndex - Index of next condition part.
 *
 * @returns {string} Condition part.
 */
function getValue(condition, startAtIndex, nextIndex) {
  return condition.substring(startAtIndex, nextIndex - startAtIndex + 1);
}

/**
 * Returns regex to find attribute with value in any HTML tag.
 *
 * @param {string} attr - Attribute name.
 * @param {string} value - Attribute value.
 *
 * @returns {string} Regular expression that can be used in matches.
 */
function getTagWithAttributeValue(attr, value) {
  return `(?=<[^>]+${attr}=(?=[\\s+\\"\\']${value}[\\s+\\"\\']).+)([^>]+>)`;
}

/**
 * Uses match all to find attribute with value in any HTML tag.
 *
 * @param {string} html - HTML.
 * @param {string} attributeName - Attribute name.
 * @param {string} value - Attribute value.
 *
 * @returns {Iterator} - Regex matchAll iterator.
 */
function match(html, attributeName, value) {
  return html.matchAll(getTagWithAttributeValue(attributeName, value), 'g');
}

/**
 * Uses regular expressions to return all elements that have given class.
 *
 * @param {string} html - HTML.
 * @param {string} className - Name of the class.
 *
 * @returns {Iterator} Non-resettable iterator with matches.
 */
function matchClass(html, className) {
  return match(html, 'class', className);
}

/**
 * Uses regular expressions to return all elements that have given id.
 *
 * @param {string} html - HTML.
 * @param {string} idName - Name of the id.
 *
 * @returns {Iterator} Non-resettable iterator with matches.
 */
function matchId(html, idName) {
  return match(html, 'id', idName);
}

/**
 * Returns single item for all matches.
 *
 * @param {Array} matches - List of previous matches.
 * @param {number} index - Index of item we look for.
 *
 * @returns {Any} Item at given index in array or
 * first or last element if index was out of bounds.
 */
function matchIndex(matches, index) {
  index = Math.max(Math.min(matches.length, index), 0);
  return matches[index];
}

/**
 * Helper function that works as indexOf but allows regular expression.
 *
 * @param {string} text - Text in which to look for matches.
 * @param {string} regex - Regular expression for lookup.
 * @param {number} startPos - Starting position.
 *
 * @returns {number} Index of expression matching regex.
 */
function regexIndexOf(text, regex, startPos) {
  const indexOf = text.substring(startPos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startPos || 0) : indexOf;
}

/**
 * Returns element name from index. Assumes that index is either at
 * or right after the <.
 *
 * @param {string} html - HTML in which the element should be looked up.
 * @param {number} index - Index where to start.
 *
 * @returns {string} Element name.
 */
function getElementName(html, index) {
  const endIndex = regexIndexOf(html, '[ >]', index);
  let startIndex;
  if (html[index] === '<') {
    startIndex = index + 1;
  } else {
    startIndex = index;
  }

  return html.substring(startIndex, endIndex);
}

/**
 *
 * Creates sub document object model (DOM).
 * In simple terms it's sort of like substring for DOM.
 *
 * @param {string} html - HTML from which the sub DOM should be created.
 * @param {number} index - Index where the sub DOM should start.
 *
 * @returns {string} Sub DOM HTML or original HTML if any problem occurred.
 */
async function subDom(html, index) {
  if (index === 0) return html;

  const start = html.lastIndexOf('<', index);
  if (start < 0) {
    return html;
  }

  const stack = [];

  for (let i = start; i < html.length - 1; i++) {
    const char = html[i];
    if (char === '<' && html[i + 1] === '/') {
      const elementName = getElementName(html, i + 2);
      const lastIndex = stack.lastIndexOf(elementName);
      stack.length = Math.max(0, lastIndex);
    } else if (char === '<') {
      const elementName = getElementName(html, i + 1);
      stack.push(elementName);
    }

    if (stack.length === 0) {
      // todo add <> matching to ensure the right one is selected
      const tagEnd = html.indexOf('>', i) + 1;
      return html.substring(start, tagEnd);
    }
  }

  return html;
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

  let result = [html];
  const matchArray = [];

  while (i < length) {
    const startAt = i + 1;
    const nextIndex = nextPart(condition, startAt);
    const type = condition[i];
    const partValue = getValue(condition, startAt, nextIndex);

    matchArray.length = 0;

    if (type === '[') {
      const endBracketIndex = condition.indexOf(']', startAt);
      const indexString = condition.substring(startAt, endBracketIndex);
      try {
        const index = parseInt(indexString);
        matchArray.push(matchIndex(result, index));
      } catch (exception) {
        __.log(exception);
        return html;
      }
    } else {
      for (let k = 0; k < result.length; k++) {
        const itemHTML = result[k];
        let matches;
        if (type === '.') {
          matches = matchClass(itemHTML, partValue);
        } else if (type === '#') {
          matches = matchId(html, partValue);
        } else {
          return html;
        }

        for (const match of matches) {
          const matchHTML = await subDom(itemHTML, match.index);
          matchArray.push(matchHTML);
        }
      }
    }

    result = [...matchArray];

    i = nextIndex;
  }

  return result;
}
