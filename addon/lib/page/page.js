/* exported Page */

/**
 * Class representing a webpage.
 */
class Page {

  /**
   * @returns {string} Enumeration of Page change states. Any value other
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
   * @param {string} id - ID of the page.
   * @param {Object} data - Serialised Page object from storage.
   *
   * @property {string} id - ID of the page.
   * @property {string} title - Title of the page.
   * @property {string} url - URL of the page.
   * @property {stateEnum} state - Current scan state of the page.
   * @property {integer} changeThreshold - Number of characters changed before
   * signalling that a change has occurred.
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
  constructor(id, data={}) {
    this.id = id;
    this.title = data.title || 'New Page';
    this.url = data.url;
    this.changeThreshold = data.changeThreshold;
    this.scanRateMinutes = data.scanRateMinutes;
    this.state = data.state;
    this.error = data.error;
    this.errorMessage = data.errorMessage;
    this.lastAutoscanTime = data.lastAutoscanTime;
    this.oldScanTime = data.oldScanTime;
    this.newScanTime = data.newScanTime;
  }

  /**
   * Convert the Page instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {title: this.title,
            url: this.url,
            changeThreshold: this.changeThreshold,
            scanRateMinutes: this.scanRateMinutes,
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
  static load(id) {
    return Storage.load(Page._KEY(id)).then((data) => {
      return new Page(id, data);
    }).catch((error) => {
      console.log('ERROR:Page.load:' + error);
      return new Page(id);
    });
  }

  /**
   * Save the Page to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  save() {
    return Storage.save(Page._KEY(this.id), this._toObject())
      .catch((error) => console.log('ERROR:Page.save:' + error));
  }
}
