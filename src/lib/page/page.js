import {Storage} from '/lib/util/storage.js';
import {log} from '/lib/util/log.js';

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
};

/**
 * Class representing a webpage.
 */
export class Page {
  /**
   * @returns {Object} Default values for new Pages.
   */
  static get DEFAULTS() {
    return {
      title: 'New Page',
      url: null,
      scanRateMinutes: 24 * 60,
      changeThreshold: 100,
      ignoreNumbers: false,
      encoding: null,
      highlightChanges: true,
      highlightColour: '#ffff66',
      markChanges: false,
      doPost: false,
      postParams: null,
      state: Page.stateEnum.NO_CHANGE,
      lastAutoscanTime: null,
      oldScanTime: null,
      newScanTime: null,
    };
  }

  /**
   * @returns {Object} Enumeration of Page change states. Any value other
   * than NO_CHANGE or CHANGE indicates an error.
   */
  static get stateEnum() {
    return {
      NO_CHANGE: 'no_change',
      CHANGED: 'changed',
      ERROR: 'error',
    };
  }

  /**
   * @param {string} id - ID of the Page.
   * @returns {string} Storage key for the Page object.
   */
  static _KEY(id) {
    return 'page:' + id;
  }

  /**
   * @param {string} key - Storage key for the Page object.
   *
   * @returns {string} Page ID, or null if the key is not for a Page object.
   */
  static idFromKey(key) {
    const matches = key.match('^page:(.*)$');
    if (matches === null) {
      return null;
    } else {
      return matches[1];
    }
  }

  /**
   * @param {string} key - Storage key.
   *
   * @returns {bool} True if the key is for a Page object.
   */
  static isPageKey(key) {
    return Page.idFromKey(key) !== null;
  }

  /**
   * @param {string} id - ID of the page.
   * @param {Object} data - Serialised Page object from storage.
   *
   * @property {string} id - ID of the page.
   * @property {string} title - Title of the page.
   * @property {string} url - URL of the page.
   * @property {integer} scanRateMinutes - Number of minutes between scans. Zero
   * means manual scan only.
   * @property {integer} changeThreshold - Number of characters changed before
   * signalling that a change has occurred.
   * @property {boolean} ignoreNumbers - Don't trigger if only a number has
   * changed.
   * @property {string} encoding - Text encoding of the page.
   * @property {boolean} highlightChanges - Whether to highlight changed text.
   * @property {string} highlightColour - HTML colour string to use for
   * highlighting.
   * @property {boolean} markChanges - Whether to mark changes with << >>.
   * @property {boolean} doPost - Perform a POST request instead of a GET.
   * @property {boolean} postParams - POST parameters to use if doPost is true.
   * @property {stateEnum} state - Current scan state of the page.
   * @property {integer} lastAutoscanTime - Time that this page was last
   * autoscanned (ms since Unix epoch).
   * @property {integer} oldScanTime - Time when the OLD HTML was last updated
   * (ms since Unix epoch).
   * @property {integer} newScanTime - Time when the NEW HTML was last updated
   * (ms since Unix epoch).
   */
  constructor(id, {
    title=Page.DEFAULTS.title,
    url=Page.DEFAULTS.url,
    scanRateMinutes=Page.DEFAULTS.scanRateMinutes,
    changeThreshold=Page.DEFAULTS.changeThreshold,
    ignoreNumbers=Page.DEFAULTS.ignoreNumbers,
    encoding=Page.DEFAULTS.encoding,
    highlightChanges=Page.DEFAULTS.highlightChanges,
    highlightColour=Page.DEFAULTS.highlightColour,
    markChanges=Page.DEFAULTS.markChanges,
    doPost=Page.DEFAULTS.doPost,
    postParams=Page.DEFAULTS.postParams,
    state=Page.DEFAULTS.state,
    lastAutoscanTime=Page.DEFAULTS.lastAutoscanTime,
    oldScanTime=Page.DEFAULTS.oldScanTime,
    newScanTime=Page.DEFAULTS.newScanTime,
  }) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.scanRateMinutes = scanRateMinutes;
    this.changeThreshold = changeThreshold;
    this.ignoreNumbers = ignoreNumbers;
    this.encoding = encoding,
    this.highlightChanges = highlightChanges,
    this.highlightColour = highlightColour,
    this.markChanges = markChanges,
    this.doPost = doPost,
    this.postParams = postParams,
    this.state = state;
    this.lastAutoscanTime = lastAutoscanTime;
    this.oldScanTime = oldScanTime;
    this.newScanTime = newScanTime;
  }

  /**
   * Convert the Page instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {
      title: this.title,
      url: this.url,
      scanRateMinutes: this.scanRateMinutes,
      changeThreshold: this.changeThreshold,
      ignoreNumbers: this.ignoreNumbers,
      encoding: this.encoding,
      highlightChanges: this.highlightChanges,
      highlightColour: this.highlightColour,
      markChanges: this.markChanges,
      doPost: this.doPost,
      postParams: this.postParams,
      state: this.state,
      lastAutoscanTime: this.lastAutoscanTime,
      oldScanTime: this.oldScanTime,
      newScanTime: this.newScanTime,
    };
  }

  /**
   * @returns {Object} Object suitable for backups, excluding current scan
   * state.
   */
  backup() {
    return {
      type: 'Page',
      title: this.title,
      url: this.url,
      scanRateMinutes: this.scanRateMinutes,
      changeThreshold: this.changeThreshold,
      ignoreNumbers: this.ignoreNumbers,
      encoding: this.encoding,
      highlightChanges: this.highlightChanges,
      highlightColour: this.highlightColour,
      markChanges: this.markChanges,
      doPost: this.doPost,
      postParams: this.postParams,
      // state: this.state,
      // lastAutoscanTime: this.lastAutoscanTime,
      // oldScanTime: this.oldScanTime,
      // newScanTime: this.newScanTime,
    };
  }

  /**
   * Load the Page from storage. If it doesn't exist or an error occurs,
   * an empty default Page is returned.
   *
   * @param {string} id - ID of the Page.
   *
   * @returns {Promise} A Promise that fulfils with a Page object.
   */
  static async load(id) {
    try {
      const data = await Storage.load(Page._KEY(id)) || {};
      return new Page(id, data);
    } catch (error) {
      __.log(`ERROR: Page.load: ${error}`);
      return new Page(id, {});
    }
  }

  /**
   * Check if the Page still exists in storage. This might not be the case if
   * it was deleted by another process, for example.
   *
   * @returns {Promise} A Promise that fulfils with a boolean indicating Whether
   * the page exists in storage.
   */
  async existsInStorage() {
    try {
      const data = await Storage.load(Page._KEY(this.id));
      return (data !== undefined);
    } catch (error) {
      __.log(`ERROR: Page.existsInStorage: ${error}`);
    }
    return false;
  }

  /**
   * Save the Page to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  async save() {
    try {
      await Storage.save(Page._KEY(this.id), this._toObject());
    } catch (error) {
      __.log(`ERROR: Page.save: ${error}`);
    }
    return {};
  }

  /**
   * Delete the Page from storage.
   *
   * @returns {Promise} An empty Promise that fultils when the operation is
   * finished. Errors are logged and ignored.
   */
  async delete() {
    try {
      await Storage.remove(Page._KEY(this.id));
    } catch (error) {
      __.log(`ERROR: Page.delete: ${error}`);
    }
    return {};
  }

  /**
   * @returns {bool} True if the Page state is CHANGED.
   */
  isChanged() {
    return this.state == Page.stateEnum.CHANGED;
  }

  /**
   * @returns {bool} True if the Page state is ERROR.
   */
  isError() {
    return this.state == Page.stateEnum.ERROR;
  }
}
