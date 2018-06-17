import {readAsText} from './promise.js';
import {getFileStorage} from
  '/dependencies/module/idb-file-storage/src/idb-file-storage.js';

/**
 * @returns {Object} The storage object for UpdateScanner.
 */
async function _getStorage() {
  return await getFileStorage({name: 'updatescanner', persistent: true});
}

/**
 * @param {Object} storage - Storage object.
 * @param {string} key - Storage key.
 *
 * @returns {bool} True if the specified key exists in storage.
 */
async function _keyExists(storage, key) {
  const count = await storage.count({filterFn: (name) => (name == key)});
  return count > 0;
}

/**
 * Static functions to save and load data from IndexedDB storage.
 * Use for large amounts of data (HTML pages).
 */
export class StorageDB {
  /**
   * Save an object to storage.
   *
   * @param {string} key - Storage key returned by _pageKey(), htmlKey(), etc.
   * @param {Object} data - Object to save.
   */
  static async save(key, data) {
    const storage = await _getStorage();
    const blob = new Blob([data]);
    await storage.put(key, blob);
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
    const storage = await _getStorage();
    if (!await _keyExists(storage, key)) {
      return undefined;
    }
    const blob = await storage.get(key);
    return await readAsText(blob);
  }

  /**
   * Deletes an item from storage.
   *
   * @param {string} key - Storage key of the object to delete.
   */
  static async remove(key) {
    const storage = await _getStorage();
    await storage.remove(key);
  }
}
