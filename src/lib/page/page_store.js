import {Page} from './page';
import {PageFolder} from './page_folder';
import {StorageInfo} from './storage_info';
import {Storage} from 'util/storage';
import {log} from 'util/log';

/**
 * Class to manage saving and loading data from storage.
 */
export class PageStore {

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
    };
  }

  /**
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   * @param {StorageInfo} storageInfo - StorageInfo object loaded from storage.
   */
  constructor(pageMap, storageInfo) {
    this.pageMap = pageMap;
    this.storageInfo = storageInfo;
    this._pageUpdateHandler = null;

    this._addStorageListener();
  }

  /**
   * Loads the storageInfo objects from storage. The pageMap is populated
   * with Page and PageFolder objects, keyed by ID.
   *
   * @returns {Promise} A Promise that returns a PageStore instance with a
   * fully populated pageMap.
   */
  static async load() {
    const storageInfo = await StorageInfo.load();
    try {
      const pageMap = await PageStore._generatePageMap(storageInfo.pageIds,
        storageInfo.pageFolderIds);
      return new PageStore(pageMap, storageInfo);
    } catch(error) {
      // Not much we can do with an error. Set to an empty pageMap.
      console.log.bind(console);
      return new PageStore(PageStore.ROOT_PAGE_MAP, {});
    }
  }

  /**
   * Get a Page/PageFolder object.
   *
   * @param {string} pageId - ID of the Page to return.
   *
   * @returns {Page|PageFolder} Object with the specified ID.
   */
  getPage(pageId) {
    return this.pageMap.get(pageId);
  }

  /**
   * @returns {Array.<Page|PageFolder>} Array of Page objects in the pageMap.
   */
  getPageList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => item instanceof Page);
  }

  /**
   * Create a new Page object, updating the StorageInfo and PageMap.
   *
   * @param {string} parentId - ID of the parent PageFolder.
   *
   * @returns {Promise} A Promise that fulfils with the new Page object.
   */
  async createPage(parentId) {
    // Update StorageInfo with the new Page, returning the new Page ID
    const pageId = this.storageInfo.createPage();
    await this.storageInfo.save();

    // Update the parent PageFolder
    const pageFolder = this.pageMap.get(parentId);
    pageFolder.children.push(pageId);
    await pageFolder.save();

    // Create the Page
    const page = new Page(pageId);

    // Update the PageMap
    this.pageMap.set(pageId, page);

    return page;
  }

  /**
   * @param {Function} handler - Called when a Page in the PageStore is updated.
   */
  bindPageUpdate(handler) {
    this._pageUpdateHandler = handler;
  }

  /**
   * Listen to Storage changes, handling any Page updates.
   */
  _addStorageListener() {
    Storage.addListener((changes) => {
      // Iterate over changes, handling any Page updates
      for (const key of Object.keys(changes)) {
        const pageId = Page.idFromKey(key);
        if (pageId !== null) {
          this._handlePageUpdate(pageId, changes[key]);
        }
      }
    });
  }

  /**
   * Handle Page changes by updating the PageMap and calling _pageUpdateHandler.
   *
   * @param {string} pageId - ID of the page that changed.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  _handlePageUpdate(pageId, change) {
    // Update the pageMap with the new Page
    this.pageMap.set(pageId, new Page(pageId, change.newValue));

    // Call the handler, if one is registered
    if (this._pageUpdateHandler !== null) {
      this._pageUpdateHandler(pageId, change);
    }
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
  static async _generatePageMap(pageIds, pageFolderIds) {
    const promises = [];
    const pageMap = new Map();

    // Make an array of promises, each returning a PageFolder or Page
    for (let i=0; i<pageFolderIds.length; i++) {
      promises.push(PageFolder.load(pageFolderIds[i]));
    }
    for (let i=0; i<pageIds.length; i++) {
      promises.push(Page.load(pageIds[i]));
    }

    // Resolve all promises, adding the results to the pageMap
    const items = await Promise.all(promises);
    for (const item of items) {
      pageMap.set(item.id, item);
    }

    if (pageMap.size == 0) {
      return PageStore.ROOT_PAGE_MAP;
    }
    return pageMap;
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
      .catch((error) => log('ERROR:PageStore.saveHtml:' + error));
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
        log('ERROR:PageStore.loadHtml:' + error);
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


/**
 * @param {storage.StorageChange} change - Object representing the change.
 *
 * @returns {boolean} True if the change represents a change in page state or
 * the page was added or deleted.
 */
export function hasPageStateChanged(change) {
  return (change.oldValue === undefined || change.newValue === undefined ||
    (change.oldValue.state != change.newValue.state));
}
