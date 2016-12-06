/* exported PageFolder */

/**
 * Class representing a folder of Pages.
 */
class PageFolder {
  /**
   * @param {string} id - ID of the PageFolder.
   * @returns {string} Storage key for the PageFolder object.
   */
  static _KEY(id) {
    return 'page_folder:' + id;
  }

  /**
   * @param {string} id - ID of the PageFolder.
   * @param {Object} data - Serialised PageFoler object from storage.
   */
  constructor(id, data={}) {
    this.id = id;
    this.title = data.title || 'New Folder';
    this.children = data.children || [];
  }

  /**
   * Convert the PageFolder instance to an object suitable for storage.
   *
   * @returns {Object} Object suitable for storage.
   */
  _toObject() {
    return {title: this.title,
            children: this.children,
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
  static load(id) {
    return Storage.load(PageFolder._KEY(id)).then((data) => {
      return new PageFolder(id, data);
    }).catch((error) => {
      console.log('ERROR:PageFolder.load:' + error);
      return new PageFolder(id);
    });
  }

  /**
   * Save the PageFolder to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the operation is
   * finished. Errors are logged and ignored.
   */
  save() {
    return Storage.save(PageFolder._KEY(this.id), this._toObject())
      .catch((error) => console.log('ERROR:PageFolder.save:' + error));
  }
}
