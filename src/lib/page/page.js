import {Storage} from 'util/storage';
import {log} from 'util/log';

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
      state: Page.stateEnum.NO_CHANGE,
      error: null,
      errorMessage: null,
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
    return {NO_CHANGE: 'no_change',
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
   * @property {stateEnum} state - Current scan state of the page.
   * @property {boolean} error - Indicates whether the last scan failed due to
   * an error.
   * @property {string} errorMessage - If error is true, contains the error
   * message from the last scan.
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
    state=Page.DEFAULTS.state,
    error=Page.DEFAULTS.error,
    errorMessage=Page.DEFAULTS.errorMessage,
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
    this.state = state;
    this.error = error;
    this.errorMessage = errorMessage;
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
    return {title: this.title,
            url: this.url,
            scanRateMinutes: this.scanRateMinutes,
            changeThreshold: this.changeThreshold,
            ignoreNumbers: this.ignoreNumbers,
            state: this.state,
            error: this.error,
            errorMessage: this.errorMessage,
            lastAutoscanTime: this.lastAutoscanTime,
            oldScanTime: this.oldScanTime,
            newScanTime: this.newScanTime,
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
      log(`ERROR: Page.load: ${error}`);
      return new Page(id, {});
    }
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
      log(`ERROR: Page.save: ${error}`);
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
      log(`ERROR: Page.delete: ${error}`);
    }
    return {};
  }
}
