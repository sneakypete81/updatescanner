/**
 * Static functions to save and load data from storage.
 */
export class Storage {
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
  static async load(key) {
    const result = await browser.storage.local.get(key);
    if (key in result) {
      return result[key];
    } else {
      return undefined;
    }
  }

  /**
   * Deletes an item from storage.
   *
   * @param {string} key - Storage key of the object to delete.
   *
   * @returns {Promise} A promise that will be fulfilled when the operation is
   * completed, or rejected if the operation fails.
   */
  static remove(key) {
    return browser.storage.local.remove(key);
  }

  /**
   * Adds a listener that fires whenever a Storage item is updated.
   * See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/onChanged.
   *
   * @param {callback} listener - Called when a local Storage item is updated.
   */
  static addListener(listener) {
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName == 'local') {
        listener(changes);
      }
    });
  }

  /**
   * Stop listening to storage.onChanged events.
   * See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/onChanged.
   *
   * @param {callback} listener - Listener to remove.
   */
  static removeListener(listener) {
    browser.storage.onChanged.removeListener(listener);
  }
}
