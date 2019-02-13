import {Storage} from '/lib/util/storage.js';
import {log} from '/lib/util/log.js';

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
};

/**
 * Class representing a folder of Pages.
 */
export class PageFolder {
  /**
   * @returns {Object} Default values for new Pages.
   */
  static get DEFAULTS() {
    return {
      title: 'New Folder',
      state: PageFolder.stateEnum.NO_CHANGE,
    };
  }

  /**
   * @returns {Object} Enumeration of PageFolder change states.
   */
  static get stateEnum() {
    return {
      NO_CHANGE: 'no_change',
      CHANGED: 'changed',
    };
  }

  /**
   * @param {string} id - ID of the PageFolder.
   * @returns {string} Storage key for the PageFolder object.
   */
  static _KEY(id) {
    return 'page_folder:' + id;
  }

  /**
   * @param {string} key - Storage key for the PageFolder object.
   *
   * @returns {string} PageFolder ID, or null if the key is not for a PageFolder
   * object.
   */
  static idFromKey(key) {
    const matches = key.match('^page_folder:(.*)$');
    if (matches === null) {
      return null;
    } else {
      return matches[1];
    }
  }

  /**
   * @param {string} key - Storage key.
   *
   * @returns {bool} True if the key is for a PageFolder object.
   */
  static isPageFolderKey(key) {
    return PageFolder.idFromKey(key) !== null;
  }

  /**
   * @param {string} id - ID of the PageFolder.
   * @param {Object} data - Serialised PageFoler object from storage.
   */
  constructor(id, {
    title=PageFolder.DEFAULTS.title,
    state=PageFolder.DEFAULTS.state,
    children=[],
  }) {
    this.id = id;
    this.title = title;
    this.state = state;
    this.children = children;
  }

  /**
   * Convert the PageFolder instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {
      title: this.title,
      state: this.state,
      children: this.children,
    };
  }

  /**
   * @returns {Object} Object suitable for backups, excluding current scan
   * state and child IDs.
   */
  backup() {
    return {
      type: 'PageFolder',
      title: this.title,
      // state: this.state,
      // children: this.children,
    };
  }

  /**
   * Load the PageFolder from storage. If it doesn't exist or an error occurs,
   * an empty default PageFolder is returned.
   *
   * @param {string} id - ID of the PageFolder.
   *
   * @returns {Promise} A Promise that fulfils with a PageFolder object.
   */
  static async load(id) {
    try {
      const data = await Storage.load(PageFolder._KEY(id)) || {};
      return new PageFolder(id, data);
    } catch (error) {
      __.log(`ERROR: PageFolder.load: ${error}`);
      return new PageFolder(id, {});
    }
  }

  /**
   * Save the PageFolder to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  async save() {
    try {
      await Storage.save(PageFolder._KEY(this.id), this._toObject());
    } catch (error) {
      __.log(`ERROR: PageFolder.save: ${error}`);
    }
    return {};
  }

  /**
   * Delete the PageFolder from storage.
   *
   * @returns {Promise} An empty Promise that fultils when the operation is
   * finished. Errors are logged and ignored.
   */
  async delete() {
    try {
      await Storage.remove(PageFolder._KEY(this.id));
    } catch (error) {
      __.log(`ERROR: PageFolder.delete: ${error}`);
    }
    return {};
  }

  /**
   * @returns {bool} True if the PageFolder state is CHANGED.
   */
  isChanged() {
    return this.state == PageFolder.stateEnum.CHANGED;
  }
}
