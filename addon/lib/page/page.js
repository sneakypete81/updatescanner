/* exported Page */

/**
 * Class representing a webpage.
 */
class Page {
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
   */
  constructor(id, data={}) {
    this.id = id;
    this.title = data.title || 'New Page';
  }

  /**
   * Convert the Page instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {title: this.title,
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
