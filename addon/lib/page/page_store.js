/* global PageTree, Page */
/* exported PageStore */

/**
 * Static functions to save and load data from storage.
 */
class PageStore {
  /**
   * Save an object to storage.
   *
   * @param {string} key - Storage key returned by _pageKey(), htmlKey(), etc.
   * @param {Object} data - Object to save.
   *
   * @returns {Promise} An empty Promise that will be fulfilled when the save
   * has completed.
   */
  static _saveData(key, data) {
    return browser.storage.local.set({[key]: data});
  }

  /**
   * Load an object from storage.
   *
   * @param {string} key - Storage key returned by _pageKey(), htmlKey(), etc.
   *
   * @returns {Promise} A promise that will be fulfilled with the requested
   * object. If the object doesn't exist, the promise returns undefined.
   */
  static _loadData(key) {
    return browser.storage.local.get(key).then(function(result) {
      if (key in result) {
        return result[key];
      } else {
        return undefined;
      }
    });
  }

  /**
   * Save a PageTree to storage.
   *
   * @param {PageTree} pageTree - PageTree to save.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static savePageTree(pageTree) {
    return PageStore._saveData(PageStore._pageTreeKey(), pageTree.data)
      .catch((error) => console.log.bind(console));
  }

  /**
   * Load a PageTree from storage.
   *
   * @returns {Promise} A Promise that fulfils with the fully
   * populated PageTree, including child Pages and PageFolders.
   */
  static loadPageTree() {
    // Return a promise that first loads the PageTree data
    return PageStore._loadData(PageStore._pageTreeKey()).then(function(data) {
      if (data === undefined) {
        data = {};
      }
      // Then load the child Pages of the PageTree
      return PageTree.fromObject(data, PageStore.loadPage)
        .catch((error) => console.log.bind(console));
    });
  }

  /**
   * Save a Page to storage.
   *
   * @param {Page} page - Page to save.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static savePage(page) {
    return PageStore._saveData(PageStore._pageKey(page.id), page.data)
        .catch((error) => console.log.bind(console));
  }

  /**
   * Load a Page from storage.
   *
   * @param {string} pageId - ID of the Page.
   *
   * @returns {Promise} A Promise that fulfils with the requested Page.
   */
  static loadPage(pageId) {
    return PageStore._loadData(PageStore._pageKey(pageId)).then(function(data) {
      if (data === undefined) {
        data = {};
      }
      return new Page(pageId, data);
    }).catch((error) => console.log.bind(console));
  }

  /**
   * Save a Page's HTML to storage.
   *
   * @param {string} pageId - ID of the page.
   * @param {string} pageType - Page.pageTypes string identifying the HTML type.
   * @param {string} html - HTML to save.
   *
   * @returns {Promise} An empty Promise that fulfils when the save succeeds.
   * Errors are logged and discarded.
   */
  static saveHtml(pageId, pageType, html) {
    return PageStore._saveData(PageStore._htmlKey(pageId, pageType), html)
      .catch((error) => console.log.bind(console));
  }

  /**
   * Load a Page's HTML from storage.
   *
   * @param {string} pageId - ID of the page.
   * @param {string} pageType - Page.pageTypes string identifying the HTML type.
   *
   * @returns {Promise} A Promise that fulfils with the requested HTML.
   */
  static loadHtml(pageId, pageType) {
    return PageStore._loadData(PageStore._htmlKey(pageId, pageType))
      .catch((error) => console.log.bind(console));
  }

  /**
   * @returns {string} Storage key for a PageTree object.
   */
  static _pageTreeKey() {
    return 'pagetree';
  }

  /**
   * @param {string} pageId - ID of the page.
   * @returns {string} Storage key for a Page object.
   */
  static _pageKey(pageId) {
    return 'page:' + pageId;
  }

  /**
   * @param {string} pageType - Page.pageTypes string identifying the HTML type.
   * @param {string} pageId - ID of the page.
   * @returns {string} Storage key for an HTML object.
   */
  static _htmlKey(pageType, pageId) {
    return 'html:' + pageId + ':' + pageType;
  }
}
