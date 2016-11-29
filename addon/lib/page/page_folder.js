/* exported PageFolder */

/**
 * Class representing a folder of Pages.
 */
class PageFolder {
  /**
   * @param {string} id - ID of the PageFolder.
   * @param {string} name - Name of the PageFolder.
   * @param {Array} children - Array of Page instances in the folder.
   * Subfolders are represented as nested PageFolder instances.
   */
  constructor(id, name, children) {
    this.id = id;
    this.name = name;
    this.children = children;
  }

  /**
   * Object representation of a PageFolder, used for serialisation to
   * storage.
   * @typedef SerialisedPageFolder
   * @type {object}
   * @property {string} id - ID of the PageFolder.
   * @property {string} name - Name of the PageFolder.
   * @property {Array} children - Array of Page IDs in the folder.
   * Subfolders are represented as nested SerialisedPageFolder objects.
   */

  /**
   * Callback for loading Page objects from storage.
   * @callback PageFolder~pageLoadCallback
   * @param {string} id - Page ID to load.
   * @returns {Page} Page object with the specified ID.
   */

  /**
   * Create a PageFolder with contents based on the serialised data from
   * storage.
   *
   * @param {SerialisedPageFolder} data - Serialised data from storage.
   * @param {PageFolder~pageLoadCallback} loadPage - Callback to load a Page
   * object from storage.
   *
   * @returns {Promise} A Promise that will be fulfilled with the new PageFolder
   * object once all sub-Pages have been loaded.
   */
  static fromObject(data, loadPage) {
    if (data.children === undefined || data.children.length == 0) {
      return Promise.resolve(new this(data.id, data.name, []));
    }

    // Make an array of promises, each returning a child
    let promises = [];
    for (let i=0; i<data.children.length; i++) {
      const child = data.children[i];
      if (child instanceof Object) {
        // A nested PageFolder - load its children
        promises.push(PageFolder.fromObject(child, loadPage));
      } else {
        // A Page - load its contents
        promises.push(loadPage(child));
      }
    }

    let children = [];
    // Resolve the promises in sequence, constructing the list of children
    let promiseSequence = promises[0];
    for (let i=1; i<promises.length; i++) {
      promiseSequence = promiseSequence.then((child) => {
        children.push(child);
        return promises[i];
      });
    }
    // For the last promise, return the PageFolder
    return promiseSequence.then((child) => {
      children.push(child);
      return new this(data.id, data.name, children);
    });
  }
}
