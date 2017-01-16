import {Storage} from 'util/storage';

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
            };
  }

  /**
   * Load the StorageInfo from storage. If it doesn't exist or an error occurs,
   * an empty default StorageInfo is returned.
   *
   * @returns {Promise} A Promise that fulfils with a StorageInfo object.
   */
  static load() {
    return Storage.load(StorageInfo._KEY).then((data) => {
      return new StorageInfo(data);
    }).catch((error) => {
      console.log('ERROR:StorageInfo.load:' + error);
      return new StorageInfo();
    });
  }

  /**
   * Save the StorageInfo to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  save() {
    return Storage.save(StorageInfo._KEY, this._toObject())
      .catch((error) => console.log('ERROR:StorageInfo.save:' + error));
  }
}
