import {Page} from './page.js';
import {PageFolder} from './page_folder.js';
import {StorageInfo} from './storage_info.js';
import {Storage} from '/lib/util/storage.js';
import {StorageDB} from '/lib/util/storage_db.js';
import {log} from '/lib/util/log.js';

// Allow function mocking
export const __ = {
  log: (...args) => log(...args),
};

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
    this._pageFolderUpdateHandler = null;

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
      console.error(error);
      return new PageStore(
        PageStore._generatePageMap([], []), new StorageInfo());
    }
  }

  /**
   * Get a Page/PageFolder object.
   *
   * @param {string} itemId - ID of the Page to return.
   *
   * @returns {Page|PageFolder} Object with the specified ID.
   */
  getItem(itemId) {
    return this.pageMap.get(itemId);
  }

  /**
   * @returns {Array.<Page>} Array of Page objects in the pageMap.
   */
  getPageList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => item instanceof Page);
  }

  /**
   * @returns {Array.<Page>} Array of Page objects with CHANGED state.
   */
  getChangedPageList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => (item instanceof Page && item.isChanged()));
  }

  /**
   * @returns {Array.<PageFolder>} Array of PageFolder objects in the pageMap.
   */
  getPageFolderList() {
    return Array.from(this.pageMap.values()).filter(
      (item) => item instanceof PageFolder);
  }

  /**
   * @param {string} id - ID of the item to check.
   *
   * @returns {bool} True if the item is a PageFolder.
   */
  isPageFolderId(id) {
    return this.getItem(id) instanceof PageFolder;
  }

  /**
   * Finds the pagent PageFolder for the given ID.
   *
   * @param {string} itemId - ID of the child Page/PageFolder.
   *
   * @returns {PageFolder} Parent PageFolder.
   */
  findParent(itemId) {
    return this.getPageFolderList().find(
      (pageFolder) => pageFolder.children.includes(itemId)
    );
  }

  /**
   * Create a new Page object, updating the StorageInfo and PageMap.
   * Don't forget to page.save() afterwards.
   *
   * @param {string} parentId - ID of the parent PageFolder.
   * @param {integer} insertAfterIndex - Add the page after this item in the
   * parent folder. If negative, the Page will be added to the end of the parent
   * folder.
   * @param {Object} data - Values to initialise the Page object (optional).
   *
   * @returns {Promise} A Promise that fulfils with the new Page object.
   */
  async createPage(parentId, insertAfterIndex, data={}) {
    // Update StorageInfo with the new Page, returning the new Page ID
    const pageId = this.storageInfo.createPage();
    await this.storageInfo.save();

    // Update the parent PageFolder
    const parent = this.pageMap.get(parentId);
    if (insertAfterIndex < 0) {
      parent.children.push(pageId);
    } else {
      parent.children.splice(insertAfterIndex + 1, 0, pageId);
    }
    await parent.save();

    // Delete any residual HTML associated with the pageId
    await PageStore.deleteHtml(pageId);

    // Create the Page. This will cause _handleItemUpdate to update the
    // PageMap.
    return new Page(pageId, data);
  }

  /**
   * Create a new PageFolder object, updating the StorageInfo and PageMap.
   * Don't forget to pageFolder.save() afterwards.
   *
   * @param {string} parentId - ID of the parent PageFolder.
   * @param {integer} insertAfterIndex - Add the page after this item in the
   * parent folder. If negative, the Page will be added to the end of the parent
   * folder.
   *
   * @returns {Promise} A Promise that fulfils with the new PageFolder object.
   */
  async createPageFolder(parentId, insertAfterIndex) {
    // Update StorageInfo with the new PageFolder, returning the new ID
    const pageFolderId = this.storageInfo.createPageFolder();
    await this.storageInfo.save();

    // Update the parent PageFolder
    const parent = this.pageMap.get(parentId);
    if (insertAfterIndex < 0) {
      parent.children.push(pageFolderId);
    } else {
      parent.children.splice(insertAfterIndex + 1, 0, pageFolderId);
    }
    await parent.save();

    // Create the Page. This will cause _handleItemUpdate to update the
    // PageMap.
    return new PageFolder(pageFolderId, {});
  }

  /**
   * Delete a Page/PageFolder from the PageStore.
   *
   * @param {string} itemId - ID of the Page/PageFolder to delete.
   */
  async deleteItem(itemId) {
    const item = this.pageMap.get(itemId);

    // Recursively delete any children
    if (item instanceof PageFolder) {
      // Take a copy of the children array, to avoid problems when we delete
      const children = item.children.slice();
      for (const child of children) {
        await this.deleteItem(child);
      }
    }

    // Don't delete the root
    if (itemId != PageStore.ROOT_ID) {
      // Remove the page from StorageInfo
      this.storageInfo.deleteItem(itemId);
      await this.storageInfo.save();

      // Update the parent PageFolder
      const pageFolder = this.findParent(itemId);
      if (pageFolder !== undefined) {
        const index = pageFolder.children.indexOf(itemId);
        pageFolder.children.splice(index, 1);
        await pageFolder.save();
      }

      // Delete the item itself. This will cause _handleItemUpdate to update the
      // PageMap.
      if (item !== undefined) {
        await item.delete();
      }

      // Delete HTML associated with the Page
      if (item instanceof Page) {
        await PageStore.deleteHtml(itemId);
      }
    }
  }

  /**
   * Update the state of each folder based on the state of its children. Used
   * to ensure folders with changed pages are shown bold.
   *
   * @param {string} folderId - ID of the base folder to refresh
   *  (default: ROOT_ID).
   */
  refreshFolderState(folderId=PageStore.ROOT_ID) {
    // First update all subfolders recursively.
    const folder = this.getItem(folderId);
    const subFolders = folder.children.filter((id) => this.isPageFolderId(id));
    for (const subFolder of subFolders) {
      this.refreshFolderState(subFolder);
    }

    // Now check if any of the children are marked as changed.
    const childrenChanged = folder.children.some(
      (id) => this.getItem(id).isChanged());

    // Update the folder state accordingly.
    if (folder.isChanged() != childrenChanged) {
      folder.state = childrenChanged ?
        PageFolder.stateEnum.CHANGED : PageFolder.stateEnum.NO_CHANGE;
      folder.save();
    }
  }

  /**
   * Move the specified item to a new position in a different PageFolder.
   *
   * @param {string} itemId - ID of the item to move.
   * @param {string} pageFolderId - ID of the destination PageFolder.
   * @param {integer} position - New position within the PageFolder.
   */
  async moveItem(itemId, pageFolderId, position) {
    const currentParent = this.findParent(itemId);
    let currentPosition = currentParent.children.indexOf(itemId);
    const newParent = this.getItem(pageFolderId);

    // Add the item to the new parent in the specified position
    newParent.children.splice(position, 0, itemId);
    await newParent.save();

    // Remove the item from the current parent
    if (currentParent !== undefined) {
      // Increment position if we've already inserted into the same parent
      if (newParent == currentParent && currentPosition > position) {
        currentPosition++;
      }
      currentParent.children.splice(currentPosition, 1);
      await currentParent.save();
    }
    // Ensure folder changed states are updated
    this.refreshFolderState();
  }

  /**
   * Return a list of all pages that are descendants of the specified item.
   *
   * @param {string} itemId - ID of the top item to process.
   * @returns {Array.<Page>} Array of Pages beneath the specified item.
   */
  getDescendantPages(itemId) {
    const item = this.getItem(itemId);

    if (item instanceof PageFolder) {
      let descendantPages = [];
      for (const childId of item.children) {
        descendantPages = descendantPages.concat(
          this.getDescendantPages(childId)
        );
      }
      return descendantPages;
    } else {
      return [item];
    }
  }

  /**
   * Create a new Update Scanner website Page.
   *
   * @returns {Page} Created Page.
   */
  async createWebsitePage() {
    const page = await this.createPage(PageStore.ROOT_ID);
    page.title = 'Update Scanner Website';
    page.url = 'https://sneakypete81.github.io/updatescanner/';
    await page.save();
    return page;
  }

  /**
   * @param {Function} handler - Called when a Page in the PageStore is updated.
   */
  bindPageUpdate(handler) {
    this._pageUpdateHandler = handler;
  }

  /**
   * @param {Function} handler - Called when a PageFolder in the PageStore is
   * updated.
   */
  bindPageFolderUpdate(handler) {
    this._pageFolderUpdateHandler = handler;
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
          this._handleItemUpdate(pageId, changes[key], true);
        } else if (PageFolder.isPageFolderKey(key)) {
          const pageFolderId = PageFolder.idFromKey(key);
          this._handleItemUpdate(pageFolderId, changes[key], false);
        }
      }
    });
  }

  /**
   * Handle Page/PageFolder changes by updating the PageMap and calling
   * _pageUpdateHandler.
   *
   * @param {string} itemId - ID of the Page/PageFolder that changed.
   * @param {storage.StorageChange} change - Object representing the change.
   * @param {bool} isPage - True if the item is a page, False if a pageFolder.
   */
  _handleItemUpdate(itemId, change, isPage) {
    if (change.newValue === undefined) {
      // Page has been deleted
      this.pageMap.delete(itemId);
      // Don't allow Root to be deleted
      if (itemId == PageStore.ROOT_ID) {
        this.pageMap.set(itemId, new PageFolder(itemId, {title: 'root'}));
      }
    } else {
      // Update the pageMap with the new Page/PageFolder
      if (isPage) {
        this.pageMap.set(itemId, new Page(itemId, change.newValue));
      } else {
        this.pageMap.set(itemId, new PageFolder(itemId, change.newValue));
      }
    }

    // Call the handler, if one is registered
    if (isPage) {
      if (this._pageUpdateHandler !== null) {
        this._pageUpdateHandler(itemId, change);
      }
    } else {
      if (this._pageFolderUpdateHandler !== null) {
        this._pageFolderUpdateHandler(itemId, change);
      }
    }
  }

  /**
   * Given Arrays of Page and Folder IDs, loads the corresponding objects from
   * storage and generates a Map keyed by ID.
   *
   * @param {Array.<string>} pageIds - Array of page IDs.
   * @param {Array.<string>} pageFolderIds - Array of page folder IDs.
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
   * Save a Page's HTML to storageDB. Errors are logged and discarded.
   *
   * @param {string} id - ID of the page.
   * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
   * type.
   * @param {string} html - HTML to save.
   */
  static async saveHtml(id, htmlType, html) {
    try {
      await StorageDB.save(PageStore._HTML_KEY(id, htmlType), html);
    } catch (error) {
      __.log('ERROR:PageStore.saveHtml:' + error);
    }
  }

  /**
   * Load a Page's HTML from storageDB.
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
      const html = await StorageDB.load(PageStore._HTML_KEY(id, htmlType));
      if (html === undefined) {
        return null;
      }
      return html;
    } catch (error) {
      __.log('ERROR:PageStore.loadHtml:' + error);
      return null;
    }
  }

  /**
   * Delete the saved HTML from storageDB. Errors are ignored.
   *
   * @param {string} id - ID of the Page.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static async deleteHtml(id) {
    try {
      await StorageDB.remove(PageStore._HTML_KEY(id, PageStore.htmlTypes.OLD));
    } catch (error) {
      __.log('ERROR:PageStore.deleteHtml:' + error);
    }
    try {
      await StorageDB.remove(PageStore._HTML_KEY(id, PageStore.htmlTypes.NEW));
    } catch (error) {
      __.log('ERROR:PageStore.deleteHtml:' + error);
    }
    return {};
  }

  /**
   * Load a Page's HTML from the deprecated storage location. Only for use by
   * the update script.
   *
   * @param {string} id - ID of the page.
   * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
   * type.
   *
   * @returns {Promise} A Promise that fulfils with the requested HTML, or null
   * if it can't be loaded from storage.
   */
  static async loadHtmlFromDeprecatedStorage(id, htmlType) {
    try {
      const html = await Storage.load(PageStore._HTML_KEY(id, htmlType));
      if (html === undefined) {
        return null;
      }
      return html;
    } catch (error) {
      __.log('ERROR:PageStore.loadHtmlFromDeprecatedStorage:' + error);
      return null;
    }
  }

  /**
   * Delete the saved HTML from the deprecated storage location. Errors are
   * ignored. Only for use by the update script.
   *
   * @param {string} id - ID of the Page.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static async deleteHtmlFromDeprecatedStorage(id) {
    try {
      await Storage.remove(PageStore._HTML_KEY(id, PageStore.htmlTypes.OLD));
    } catch (error) {
      __.log('ERROR:PageStore.deleteHtmlFromDeprecatedStorage:' + error);
    }
    try {
      await Storage.remove(PageStore._HTML_KEY(id, PageStore.htmlTypes.NEW));
    } catch (error) {
      __.log('ERROR:PageStore.deleteHtmlFromDeprecatedStorage:' + error);
    }
    return {};
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

/**
 * @param {Page|PageFolder} item - Item to check.
 *
 * @returns {boolean} True if the item state is CHANGED.
 */
export function isItemChanged(item) {
  return item.isChanged();
}
