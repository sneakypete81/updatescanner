import {Storage} from '/lib/util/storage.js';
import {log} from '/lib/util/log.js';

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
};

/**
 * Class representing a information about the stored pages.
 */
export class StorageInfo {
  /**
   * @returns {integer} Current version of the Page Storage structure.
   */
  static get _VERSION() {
    return 1;
  }

  /**
   * @returns {string} Storage key for the StorageInfo object.
   */
  static get _KEY() {
    return 'storage_info';
  }

  /**
   * @param {Object} data - Serialised StorageInfo object.
   */
  constructor(data={}) {
    this._set(data);
    this._addStorageListener();
  }

  /**
   * Updates the StorageInfo attributes.
   *
   * @param {Object} data - Data object to update from.
   */
  _set({
    version=StorageInfo._VERSION,
    pageIds=[],
    pageFolderIds=[],
    nextId='1',
  }) {
    this.version = version;
    this.pageIds = pageIds;
    this.pageFolderIds = pageFolderIds;
    this.nextId = nextId;
  }

  /**
   * Convert the StorageInfo instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {
      version: this.version,
      pageIds: this.pageIds,
      pageFolderIds: this.pageFolderIds,
      nextId: this.nextId,
    };
  }

  /**
   * Load the StorageInfo from storage. If it doesn't exist or an error occurs,
   * an empty default StorageInfo is returned.
   *
   * @returns {Promise} A Promise that fulfils with a StorageInfo object.
   */
  static async load() {
    try {
      const data = await Storage.load(StorageInfo._KEY);
      return new StorageInfo(data);
    } catch (error) {
      __.log(`ERROR:StorageInfo.load: ${error}`);
      return new StorageInfo();
    }
  }

  /**
   * Save the StorageInfo to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  async save() {
    try {
      await Storage.save(StorageInfo._KEY, this._toObject());
    } catch (error) {
      __.log(`ERROR:StorageInfo.save: ${error}`);
    }
    return {};
  }

  /**
   * Generate an ID for a new page, and add it to the pageIds array.
   * Don't forget to save() afterwards.
   *
   * @returns {string} - ID of the new page.
   */
  createPage() {
    const pageId = this.nextId;
    this.nextId = (parseInt(pageId) + 1).toString();
    this.pageIds.push(pageId);
    return pageId;
  }

  /**
   * Generate an ID for a new pageFolder, and add it to the pageFolderIds array.
   * Don't forget to save() afterwards.
   *
   * @returns {string} - ID of the new page.
   */
  createPageFolder() {
    const pageFolderId = this.nextId;
    this.nextId = (parseInt(pageFolderId) + 1).toString();
    this.pageFolderIds.push(pageFolderId);
    return pageFolderId;
  }

  /**
   * Delete a Page/PageFolder from the pageIds array.
   * Don't forget to save() afterwards.
   *
   * @param {string} itemId - ID of the Page/PageFolder to delete.
   */
  deleteItem(itemId) {
    const pageIndex = this.pageIds.indexOf(itemId);
    if (pageIndex >= 0) {
      this.pageIds.splice(pageIndex, 1);
    }

    const pageFolderIndex = this.pageFolderIds.indexOf(itemId);
    if (pageFolderIndex >= 0) {
      this.pageFolderIds.splice(pageFolderIndex, 1);
    }
  }

  /**
   * Listen to Storage changes, handling any StorageInfo updates.
   */
  _addStorageListener() {
    Storage.addListener((changes) => {
      // Iterate over changes, handling any Page updates
      for (const key of Object.keys(changes)) {
        if (key == StorageInfo._KEY) {
          this._set(changes[key].newValue);
        }
      }
    });
  }
}
