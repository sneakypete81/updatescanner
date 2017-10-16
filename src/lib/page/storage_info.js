import {Storage} from 'util/storage';
import {log} from 'util/log';

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
    this.version = data.version || StorageInfo._VERSION;
    this.pageIds = data.pageIds || [];
    this.pageFolderIds = data.pageFolderIds || [];
    this.nextId = data.nextId || '1';
  }

  /**
   * Convert the StorageInfo instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {version: this.version,
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
      log(`ERROR:StorageInfo.load: ${error}`);
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
      log(`ERROR:StorageInfo.save: ${error}`);
    }
    return {};
  }

  /**
   * Generate an ID for a new page, and add it to the pageIds array. Don't
   * forget to save() afterwards.
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
   * Delete a Page from the pageIds array. Don't forget to save() afterwards.
   *
   * @param {integer} pageId - ID of the Page to delete.
   */
  deletePage(pageId) {
    const pageIndex = this.pageIds.indexOf(pageId);
    if (pageIndex >= 0) {
      this.pageIds.splice(pageIndex, 1);
    }
  }
}
