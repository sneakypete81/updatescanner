/* exported Storage */

/**
 * Static functions to save and load data from storage.
 */
class Storage {

  /**
   * Save an object to storage.
   *
   * @param {string} key - Storage key returned by _pageKey(), htmlKey(), etc.
   * @param {Object} data - Object to save.
   *
   * @returns {Promise} An empty Promise that will be fulfilled when the save
   * has completed, or rejected if the operation fails.
   */
  static save(key, data) {
    return browser.storage.local.set({[key]: data});
  }

  /**
   * Load an object from storage.
   *
   * @param {string} key - Storage key corresponding to an object in storage.
   *
   * @returns {Promise} A promise that will be fulfilled with the requested
   * object. If the object doesn't exist, the promise returns undefined.
   * If the operation fails, the promise will be rejected.
   */
  static load(key) {
    return browser.storage.local.get(key).then(function(result) {
      if (key in result) {
        return result[key];
      } else {
        return undefined;
      }
    });
  }
}
