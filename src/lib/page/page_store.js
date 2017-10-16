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
      const pageMap = await PageStore._generatePageMap(
        storageInfo.pageIds, storageInfo.pageFolderIds);

      if (!storageInfo.pageFolderIds.includes(PageStore.ROOT_ID)) {
        storageInfo.pageFolderIds.push(PageStore.ROOT_ID);
      }

      return new PageStore(pageMap, storageInfo);
    } catch (error) {
      // Not much we can do with an error. Set to an empty pageMap.
      console.log.bind(console);
      return new PageStore(
        PageStore._generatePageMap([], []), new StorageInfo());
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
   * @returns {Array.<Page>} Array of Page objects in the pageMap.
   */
  getPageList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => item instanceof Page);
  }

  /**
   * @returns {Array.<PageFolder>} Array of PageFolder objects in the pageMap.
   */
  getPageFolderList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => item instanceof PageFolder);
  }

  /**
   * Finds the pagent PageFolder for the given ID.
   *
   * @param {integer} pageId - ID of the child Page/PageFolder.
   *
   * @returns {PageFolder} Parent PageFolder.
   */
  findParent(pageId) {
    return this.getPageFolderList().find(
      (pageFolder) => pageFolder.children.includes(pageId)
    );
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
    const page = new Page(pageId, {});

    // Update the PageMap
    // @TODO: do we need this, or will the update handle this?
    this.pageMap.set(pageId, page);

    return page;
  }

  /**
   * Delete a Page from the PageStore.
   *
   * @param {integer} pageId - ID of the Page to delete.
   */
  async deletePage(pageId) {
    // Remove the page from StorageInfo
    this.storageInfo.deletePage(pageId);
    await this.storageInfo.save();

    // Update the parent PageFolder
    const pageFolder = this.findParent(pageId);
    if (pageFolder !== undefined) {
      const index = pageFolder.children.indexOf(pageId);
      pageFolder.children.splice(index, 1);
      await pageFolder.save();
    }

    // Update the PageMap
    // @TODO: do we need this, or will the update handle this?
    this.pageMap.delete(pageId);
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
        if (Page.isPageKey(key)) {
          const pageId = Page.idFromKey(key);
          this._handlePageUpdate(pageId, changes[key], true);
        } else if (PageFolder.isPageFolderKey(key)) {
          const pageFolderId = PageFolder.idFromKey(key);
          this._handlePageUpdate(pageFolderId, changes[key], false);
        }
      }
    });
  }

  /**
   * Handle Page/PageFolder changes by updating the PageMap and calling
   * _pageUpdateHandler.
   *
   * @param {string} pageId - ID of the page that changed.
   * @param {storage.StorageChange} change - Object representing the change.
   * @param {bool} isPage - True if the item is a page, False if a pageFolder.
   */
  _handlePageUpdate(pageId, change, isPage) {
    if (change.newValue === undefined) {
      // Page has been deleted
      this.pageMap.delete(pageId);
      // Don't allow Root to be deleted
      if (pageId == PageStore.ROOT_ID) {
        this.pageMap.set(pageId, new PageFolder(pageId, {title: 'root'}));
      }
    } else {
      // Update the pageMap with the new Page/PageFolder
      if (isPage) {
        this.pageMap.set(pageId, new Page(pageId, change.newValue));
      } else {
        this.pageMap.set(pageId, new PageFolder(pageId, change.newValue));
      }
    }

    // Call the handler, if one is registered
    if (this._pageUpdateHandler !== null) {
      this._pageUpdateHandler(pageId, change);
    }
  }

  /**
   * Given Arrays of Page and Folder IDs, loads the corresponding objects from
   * storage and generates a Map keyed by ID.
   *
   * @param {Array.<Integer>} pageIds - Array of page IDs.
   * @param {Array.<Integer>} pageFolderIds - Array of page folder IDs.
   *
   * @returns {Promise} A Promise that resolves to the pageMap once all objects
   * have been loaded.
   */
  static async _generatePageMap(pageIds, pageFolderIds) {
    const promises = [];
    const pageMap = new Map();

    // Default root PageFolder
    pageMap.set(PageStore.ROOT_ID, new PageFolder(
      PageStore.ROOT_ID, {title: 'root', children: []},
    ));

    // Make an array of promises, each returning a PageFolder or Page
    for (let i = 0; i < pageFolderIds.length; i++) {
      promises.push(PageFolder.load(pageFolderIds[i]));
    }
    for (let i = 0; i < pageIds.length; i++) {
      promises.push(Page.load(pageIds[i]));
    }

    // Resolve all promises, adding the results to the pageMap
    const items = await Promise.all(promises);
    for (const item of items) {
      pageMap.set(item.id, item);
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
   * @returns {Promise} A Promise that fulfils with the requested HTML, or null
   * if it can't be loaded from storage.
   */
  static async loadHtml(id, htmlType) {
    try {
      const html = await Storage.load(PageStore._HTML_KEY(id, htmlType));
      if (html === undefined) {
        return null;
      }
      return html;
    } catch (error) {
      log('ERROR:PageStore.loadHtml:' + error);
      return null;
    }
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
