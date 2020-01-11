import {log} from '/lib/util/log.js';

export const __ = {
  log: (...args) => log(...args),
  matchHtmlWithSelector: matchHtmlWithSelector,
};

/**
 * Finds next part of a selector. Supports dots, hashes and square brackets.
 *
 * @param {string} selector - Selector.
 * @param {number} startFrom - Index from which to start.
 *
 * @returns {number} Index of next supported symbol.
 */
function nextPart(selector, startFrom) {
  for (let i = startFrom; i < selector.length; i++) {
    const char = selector[i];
    if (char === '.' || char === '#' || char === '[') {
      return i;
    }
  }
  return selector.length;
}

/**
 * Substrings value of selectors part.
 * Eg. #id_name where id_name is the value.
 *
 * @param {string} selector - Selector.
 * @param {number} startAtIndex - Start index of selector part.
 * @param {number} nextIndex - Index of next selector part.
 *
 * @returns {string} Selector part.
 */
function getValue(selector, startAtIndex, nextIndex) {
  return selector.substring(startAtIndex, nextIndex);
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
  const classNameRegex = '((-?[_a-zA-Z]+[_a-zA-Z0-9-]*)? *)*';
  const inner = `${classNameRegex}${value}${classNameRegex}`;
  return `(?=<[^>]+${attr}=(?=[\\s+\\"\\']${inner}[\\s+\\"\\']).+)([^>]+>)`;
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
 * @returns {?string} Item at given index in array or
 * first or last element if index was out of bounds.
 */
function matchIndex(matches, index) {
  if (matches.length === 0 || index < 0 || index >= matches.length) {
    return null;
  }

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
  let i = 0;
  const length = selector.length;

  let result = [html];
  const matchArray = [];

  while (i < length) {
    const startAt = i + 1;
    const nextIndex = nextPart(selector, startAt);
    const type = selector[i];
    const partValue = getValue(selector, startAt, nextIndex);

    matchArray.length = 0;

    if (type === '[') {
      const endBracketIndex = selector.indexOf(']', startAt);
      const indexString = selector.substring(startAt, endBracketIndex);
      try {
        const index = parseInt(indexString);
        const matchedItemAtIndex = matchIndex(result, index);
        if (matchedItemAtIndex !== null) {
          matchArray.push(matchedItemAtIndex);
        }
      } catch (exception) {
        __.log(exception);
        return [html];
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
          __.log(`unknown type ${type}`);
          return [html];
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
