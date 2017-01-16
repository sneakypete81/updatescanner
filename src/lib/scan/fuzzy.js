/**
 * Class used to scan a list of webpages and test for updates.
 */
export class Fuzzy {
  /**
   * Check if two HTML strings differ by more than a threshold.
   *
   * @param {string} html1 - First HTML string for comparison.
   * @param {string} html2 - Second HTML string for comparison.
   * @param {integer} changeThreshold - Number of characters that must change to
   * indicate a major change.
   *
   * @returns {boolean} Returns True if the two HTML strings differ by more than
   * changeThreshold charagers.
   */
  static isMajorChange(html1, html2, changeThreshold) {
    return false;
  }
}
