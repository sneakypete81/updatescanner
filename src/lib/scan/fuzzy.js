/**
 * Check if two strings differ by more than a threshold. More efficient
 * than doing a full diff.
 *
 * @param {string} str1 - First string for comparison.
 * @param {string} str2 - Second string for comparison.
 * @param {integer} changeThreshold - Number of characters that must change to
 * indicate a major change.
 *
 * @returns {boolean} Returns true if the two strings differ by more than
 * changeThreshold charagers.
 */
export function isMajorChange(str1='', str2='', changeThreshold) {
  const safeStr1 = str1;
  const safeStr2 = str2;

  if (changeThreshold == 0) {
    return (safeStr1 != safeStr2);
  }

  // Start with sliceLength=0 and slowly increase it until it reaches the
  // changeTheshold. If a match isn't found by then, it's a major change.
  let sliceLength = 0;

  while (sliceLength < changeThreshold) {
    if (sliceLength < 100) {
      sliceLength += 10;
    } else {
      sliceLength += 100;
    }

    // If there's match with this slice length, it's not a major change.
    if (matchSlice(safeStr1, safeStr2, sliceLength)) {
      return false;
    }
  }
  return true;
}


/**
 * Check whether the two strings can be made to match by removing slices of
 * text.
 *
 * @param {string} str1 - First string for comparison.
 * @param {string} str2 - Second string for comparison.
 * @param {integer} sliceLength - Maximum number of characters to remove when
 * looking for a match.
 *
 * @returns {boolean} Returns true if a match can be made by removing slices of
 * text.
 */
function matchSlice(str1, str2, sliceLength) {
  // If the lengths are too different, it's not a match
  if (lengthDifference(str1, str2) > sliceLength) {
    return false;
  }

  // At each difference, cut out a slice, then see if the remaining text
  // matches up.
  while (str1 != str2) {
    const index = firstDifference(str1, str2);

    const shortest = Math.min(str1.length, str2.length);
    if (shortest < index + (sliceLength * 2)) {
      // Got to the end, it's a match
      return true;
    }

    // Slice the start off each string
    str1 = str1.slice(index + sliceLength);
    str2 = str2.slice(index + sliceLength);

    // See if there's a match within sliceLength
    for (let i = 0; ; i++) {
      // Does the match last for 10 characters?
      // First try slicing the start off str1
      if (str1.slice(i, i + 10) == str2.slice(0, 10)) {
        str1 = str1.slice(i);
        break;
      }
      // Now try slicing the start off str2
      if (str2.slice(i, i + 10) == str1.slice(0, 10)) {
        str2 = str2.slice(i);
        break;
      }

      // If we reach the theshold, it's not a match
      if (i == sliceLength) {
        return false;
      }
    }
  }
  // We've got a match
  return true;
}

/**
 * Calculate the difference in length of two strings.
 *
 * @param {string} str1 - First string for comparison.
 * @param {string} str2 - Second string for comparison.
 *
 * @returns {integer} Difference in length of the two strings.
 */
function lengthDifference(str1, str2) {
  return Math.max(str1.length, str2.length) -
         Math.min(str1.length, str2.length);
}

/**
 * Find the first index where the two strings don't match.
 *
 * @param {string} str1 - First string for comparison.
 * @param {string} str2 - Second string for comparison.
 *
 * @returns {integer} First index where the two strings don't match.
 */
function firstDifference(str1, str2) {
  const minlen = Math.min(str1.length, str2.length);

  for (let i = 0; i < minlen; i++) {
    if (str1[i] != str2[i]) {
      return i;
    }
  }
  return minlen;
}
