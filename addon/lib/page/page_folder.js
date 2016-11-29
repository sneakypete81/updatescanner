/* exported PageFolder */

/**
 * Class representing a folder of Pages.
 */
class PageFolder {
  /**
   * PageFolder constructor.
   */
  constructor() {
    this.id = undefined;
    this.name = undefined;
    /**
     * Array of Page instances in the folder. Subfolders are represented as
     * nested PageFolder instances.
     * @member {Array.(Page|PageFolder)}
     */
    this.children = [];
  }

  /**
   * Object representation of a PageFolder, used for serialisation to
   * storage.
   * @typedef SerialisedPageFolder
   * @type {object}
   * @property {string} id - ID of the PageFolder.
   * @property {string} name - Name of the PageFolder.
   * @property {Array.(string|PageFolderData)} children - Array of Page IDs in
   * the folder. Subfolders are represented as nested SerialisedPageFolder
   * objects.
   */

  /**
   * Callback for loading Page objects from storage.
   * @callback PageFolder~pageLoadCallback
   * @param {string} id - Page ID to load.
   * @returns {Page} Page object with the specified ID.
   */

  /**
   * Update this.children (the Page/PageFolder instance tree) based on the
   * serialised data from storage.
   *
   * @param {SerialisedPageFolder} data - Serialised data from storage.
   * @param {PageFolder~pageLoadCallback} loadPage - Callback to load a Page
   * object from storage.
   *
   * @returns {Promise} A Promise that will be fulfilled with this PageFolder
   * object (to aid chaining) once all sub-Pages have been loaded.
   */
  deserialise(data, loadPage) {
    // @TODO: Convert to static fromObject?
    this.id = data.id;
    this.name = data.name;
    this.children = [];

    if (data.children === undefined || data.children.length == 0) {
      return Promise.resolve(this);
    }

    // Make an array of promises, each returning a child
    let promises = [];
    for (let i=0; i<data.children.length; i++) {
      if (data.children[i] instanceof Object) {
        // A nested PageFolder - load its children
        promises.push(new PageFolder().deserialise(data.children[i], loadPage));
      } else {
        // A Page - load its contents
        promises.push(loadPage(data.children[i]));
      }
    }

    // Resolve the promises in sequence, appending each child to this.children
    let promiseSequence = promises[0];
    for (let i=1; i<promises.length; i++) {
      promiseSequence = promiseSequence.then((child) => {
        this.children.push(child);
        return promises[i];
      });
    }
    // For the last promise, return this PageFolder
    return promiseSequence.then((child) => {
      this.children.push(child);
      return this;
    });
  }
}
