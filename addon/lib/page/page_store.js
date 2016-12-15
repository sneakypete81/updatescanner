/* global StorageInfo, Page, PageFolder */
/* exported PageStore */

/**
 * Class to manage saving and loading data from storage.
 */
class PageStore {

  /**
   * @returns {string} The ID of the root folder.
   */
  static get ROOT_ID() {
    return '0';
  }

  /**
   * @returns {Map} A Page Map consisting of just the root folder.
   */
  static get ROOT_PAGE_MAP() {
    return new Map([[PageStore.ROOT_ID,
      new PageFolder(PageStore.ROOT_ID, {title: 'root', children: []})]]);
  }

  /**
   * @returns {Object} Enumeration of HTML page types.
   */
  static get htmlTypes() {
    return {
      OLD: 'old',
      NEW: 'new',
      CHANGES: 'changes',
    };
  }

  /**
   * @param {Map} [pageMap={}] - Map of Page and PageFolder objects,
   * keyed by ID.
   * @param {StorageInfo} [storageInfo={}] - StorageInfo object loaded from
   * storage.
   */
  constructor(pageMap={}, storageInfo={}) {
    this.pageMap = pageMap;
    this.storageInfo = storageInfo;
  }

  /**
   * Loads the storageInfo objects from storage. The pageMap is populated
   * with Page and PageFolder objects, keyed by ID.
   *
   * @returns {Promise} A Promise that returns a PageStore instance with a
   * fully populated pageMap.
   */
  static load() {
    let storageInfo;

    // Return a promise to first load the list of Page & PageFolder IDs
    return StorageInfo.load()
      .then((storageInfo) => {
        // Then load all Pages and PageFolders into a Map
        return PageStore._generatePageMap(storageInfo.pageIds,
                                        storageInfo.pageFolderIds);
      }).then((pageMap) => {
        return new PageStore(pageMap, storageInfo);
      }).catch((error) => {
        // Not much we can do with an error. Set to an empty pageMap.
        console.log.bind(console);
        return new PageStore(PageStore.ROOT_PAGE_MAP, {});
      });
  }

  /**
   * Given Arrays of Page and Folder IDs, loads the corresponding objects from
   * storage and generates a Map keyed by ID.
   *
   * @param {Array} pageIds - Array of page IDs.
   * @param {Array} pageFolderIds - Array of page folder IDs.
   *
   * @returns {Promise} A Promise that resolves to the pageMap once all objects
   * have been loaded.
   */
  static _generatePageMap(pageIds, pageFolderIds) {
    let promises = [];
    let pageMap = new Map();

    // Make an array of promises, each returning a PageFolder or Page
    for (let i=0; i<pageFolderIds.length; i++) {
      promises.push(PageFolder.load(pageFolderIds[i]));
    }
    for (let i=0; i<pageIds.length; i++) {
      promises.push(Page.load(pageIds[i]));
    }

    // Resolve all promises, adding the results to the pageMap
    return Promise.all(promises).then((items) => {
      for (const item of items) {
        pageMap.set(item.id, item);
      }

      if (pageMap.size > 0) {
        return pageMap;
      } else {
        return PageStore.ROOT_PAGE_MAP;
      }
    });
  }

  /**
   * Save a Page's HTML to storage.
   *
   * @param {string} id - ID of the page.
   * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
   * type.
   * @param {string} html - HTML to save.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static saveHtml(id, htmlType, html) {
    return Storage.save(PageStore._HTML_KEY(id, htmlType), html)
      .catch((error) => console.log('ERROR:PageStore.saveHtml:' + error));
  }

  /**
   * Load a Page's HTML from storage.
   *
   * @param {string} id - ID of the page.
   * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
   * type.
   *
   * @returns {Promise} A Promise that fulfils with the requested HTML.
   */
  static loadHtml(id, htmlType) {
    return Storage.load(PageStore._HTML_KEY(id, htmlType))
      .catch((error) => {
        console.log('ERROR:PageStore.loadHtml:' + error);
        return undefined;
      });
  }

  /**
   * @param {string} htmlType - PageStore.htmlTypes string identifying
   * the HTML type.
   * @param {string} id - ID of the page.
   * @returns {string} Storage key for an HTML object.
   */
  static _HTML_KEY(htmlType, id) {
    return 'html:' + id + ':' + htmlType;
  }
}
