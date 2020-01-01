/**
 *
 * @param {string} condition - Condition
 * @param {string} startFrom - Index from which to start
 */
async function nextPart(condition, startFrom) {
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
export function matchHtmlWithCondition(html, condition) {
  let i = 0;
  const length = condition.length;

  const classNameRegex = '(-?[_a-zA-Z]+[_a-zA-Z0-9-]* *)*';

  while (i < length) {
    const nextIndex = nextPart(condition, i);
    const type = condition[i];

    if (type == '.') {
      const startAt = i + 1;
      const className = condition.substring(startAt, nextIndex - startAt);

      const result = html.matchAll(
        `class="${classNameRegex}${className}${classNameRegex}"`,
        'g',
      );

      return result.map((value, index, array) => html.lastIndexOf('<', index));
    } else if (type == '#') {
    } else if (type == '[') {
    } else {
      return html;
    }

    i = nextIndex;
  }
}
