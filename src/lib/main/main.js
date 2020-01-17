import * as view from './main_view.js';
import * as dialog from './dialog_view.js';
import {getMainDiffUrl, paramEnum, actionEnum} from './main_url.js';
import {openDebugInfo} from '/lib/debug_info/debug_info_url.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {diff} from '/lib/diff/diff.js';
import {log} from '/lib/util/log.js';
import {createTreeForPage} from './page_tree.js';

// Allow function mocking
export const __ = {
  diff: (...args) => diff(...args),
  viewDiff: (...args) => view.viewDiff(...args),
  log: (...args) => log(...args),
};

/**
 * Class representing the main Update Scanner content page.
 */
export class Main {
  /**
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   * @property {Page} currentPage - Currently selected page.
   * @property {view.ViewTypes} viewType - Currently selected view type.
   */
  constructor() {
    this.pageStore = null;
    this.currentPage = null;
    this.viewType = view.ViewTypes.DIFF;
  }

  /**
   * Initialise the main page's content iframe.
   */
  async init() {
    this.pageStore = await PageStore.load();

    view.init();
    view.bindMenu({
      settingsHandler: this._handleMenuSettings.bind(this),
      debugHandler: this._handleMenuDebug.bind(this),
    });
    view.bindViewDropdownChange(this._handleViewDropdownChange.bind(this));

    dialog.init();

    this._handleUrlParams(window.location.search);
  }

  /**
   * Parse and handle URL query parameters.
   *
   * @param {string} searchString - Query portion of the URL, starting with the
   * '?' character.
   */
  _handleUrlParams(searchString) {
    const params = new URLSearchParams(searchString);
    switch (this._getUrlParam(params, paramEnum.ACTION)) {
      case actionEnum.NEW_PAGE: {
        this._createNewPage(
          this._getUrlParam(params, paramEnum.TITLE),
          this._getUrlParam(params, paramEnum.URL),
          this._getUrlParam(params, paramEnum.PARENT_ID),
          parseInt(this._getUrlParam(params, paramEnum.INSERT_AFTER_INDEX)),
        );
        break;
      }
      case actionEnum.NEW_PAGE_FOLDER: {
        this._createNewPageFolder(
          this._getUrlParam(params, paramEnum.TITLE),
          this._getUrlParam(params, paramEnum.PARENT_ID),
          parseInt(this._getUrlParam(params, paramEnum.INSERT_AFTER_INDEX)),
        );
        break;
      }
      case actionEnum.SHOW_DIFF: {
        this._showDiff(
          this.pageStore.getItem(this._getUrlParam(params, paramEnum.ID)),
        );
        break;
      }
      case actionEnum.SHOW_SETTINGS: {
        const itemIdArray = JSON.parse(this._getUrlParam(params, paramEnum.ID));

        this._showSettings(itemIdArray);
        break;
      }
    }
  }

  /**
   * Returns a  value from the URL parameters, or undefined if the specified
   * key doesn't exist. This is useful because URLSearchParams.get() returns
   * null if the key doesn't exist.
   *
   * @param {URLSearchParams} params - URLSearchParams object to use.
   * @param {string} key - Parameter key to use.
   *
   * @returns {string} Value associated with the given key, or undefined if it
   * doesn't exist.
   */
  _getUrlParam(params, key) {
    if (params.has(key)) {
      return params.get(key);
    }
    return undefined;
  }

  /**
   * _Show the Dialog to create a new Page.
   *
   * @param {string} title - Default title field.
   * @param {string} url - Default url field.
   * @param {string} parentId - Parent folder of the new Page.
   * @param {number} insertAfterIndex - Add the page after this item in the
   * parent folder. If negative, the Page will be added to the end of the parent
   * folder.
   */
  async _createNewPage(
    title,
    url = '',
    parentId = PageStore.ROOT_ID,
    insertAfterIndex = -1,
  ) {
    if (url.startsWith('about') || url.startsWith('moz-extension')) {
      title = undefined;
      url = undefined;
    }

    const tmpPageNode = createTreeForPage(-1, this.pageStore);
    tmpPageNode.page.title = title;
    tmpPageNode.page.url = url;
    const newSettings = await dialog.openPageDialog(tmpPageNode);

    if (newSettings == null) {
      document.location.replace('about:blank');
    } else {
      this.currentPage = await this.pageStore.createPage(
        parentId,
        insertAfterIndex,
      );
      this._updateCurrentPage(newSettings);
      // @TODO: Scan it immediately
    }
  }

  /**
   * _Show the Dialog to create a new PageFolder.
   *
   * @param {string} title - Default title field.
   * @param {string} parentId - Parent folder of the new PageFolder.
   * @param {number} insertAfterIndex - Add the PageFolder after this item in
   * the parent folder. If negative, the PageFolder will be added to the end of
   * the parent folder.
   */
  async _createNewPageFolder(
    title,
    parentId = PageStore.ROOT_ID,
    insertAfterIndex = -1,
  ) {
    const temporaryPageFolderNode = createTreeForPage(-1, this.pageStore);
    temporaryPageFolderNode.page.title = title;
    const newSettings =
      await dialog.openPageFolderDialog(temporaryPageFolderNode);
    if (newSettings !== null) {
      const pageFolder = await this.pageStore.createPageFolder(
        parentId,
        insertAfterIndex,
      );
      pageFolder.title = newSettings.title;
      pageFolder.save();
    }
    document.location.replace('about:blank');
  }

  /**
   * Called whenever the 'Page Settings' item is chosen from the menu.
   */
  _handleMenuSettings() {
    this._showPageSettings(this.currentPage);
  }

  /**
   * Called whenever the 'Debug Info' item is chosen from the menu.
   */
  _handleMenuDebug() {
    openDebugInfo(this.currentPage.id);
  }

  /**
   * Update the current Page with new settings from the Settings dialog.
   *
   * @param {object} newSettings - Settings to apply to the current page.
   */
  async _updateCurrentPage(newSettings) {
    this.currentPage = await Page.load(this.currentPage.id);
    this._updatePage(this.currentPage, newSettings);
    await this.currentPage.save();

    document.location.replace(getMainDiffUrl(this.currentPage.id));
  }

  /**
   *
   * @param {*} oldValue - Old value.
   * @param {*} newValue - New value.
   * @returns {*} New value if new value is not null, old value otherwise.
   * @private
   */
  _getNewValue(oldValue, newValue) {
    return newValue == null ? oldValue : newValue;
  }

  /**
   * Update the current Page with new settings from the Settings dialog.
   *
   * @param {Page} page - Page to update.
   * @param {object} newSettings - Settings to apply to the current page.
   */
  async _updatePage(page, newSettings) {
    page = await Page.load(page.id);
    page.title = this._getNewValue(page.title, newSettings.title);
    page.url = this._getNewValue(page.url, newSettings.url);
    page.scanRateMinutes = this._getNewValue(
      page.scanRateMinutes,
      newSettings.scanRateMinutes,
    );
    page.changeThreshold = this._getNewValue(
      page.changeThreshold,
      newSettings.changeThreshold,
    );
    page.ignoreNumbers = this._getNewValue(
      page.ignoreNumbers,
      newSettings.ignoreNumbers,
    );
    page.selectors = this._getNewValue(
      page.selectors,
      newSettings.selectors,
    );
    page.contentMode = this._getNewValue(
      page.contentMode,
      newSettings.contentMode,
    );
    page.matchMode = this._getNewValue(
      page.matchMode,
      newSettings.matchMode,
    );
    page.requireExactMatchCount = this._getNewValue(
      page.requireExactMatchCount,
      newSettings.requireExactMatchCount,
    );
    page.partialScan = this._getNewValue(
      page.partialScan,
      newSettings.partialScan,
    );
    await page.save();
  }

  /**
   * Updates all pages in list with new settings.
   *
   * @param {Array<PageNode>} pageNodeArray - Array of pages to update.
   * @param {object} newSettings - Update object containing new options.
   * @private
   */
  async _updatePageList(pageNodeArray, newSettings) {
    if (pageNodeArray.length === 1 &&
      pageNodeArray[0].page instanceof PageFolder) {
      const updatedPageFolder = await PageFolder.load(pageNodeArray[0].page.id);
      updatedPageFolder.title = newSettings.title;
      newSettings.title = null;
      await updatedPageFolder.save();
    }

    if (pageNodeArray.length > 1) {
      this._ensureValidMultiPageSettings(newSettings);
    }

    for (let i = 0; i < pageNodeArray.length; i++) {
      const node = pageNodeArray[i];
      if (node.isFolder) {
        for (let k = 0; k < node.descendants.length; k++) {
          await this._updatePage(node.descendants[k], newSettings);
        }
      } else {
        await this._updatePage(node.page, newSettings);
      }
    }
  }

  /**
   * Ensures that pages are not accidentally overwritten in batch.
   *
   * @param {object} settings - Settings.
   * @private
   */
  _ensureValidMultiPageSettings(settings) {
    if (settings.title != null) {
      __.log('Title was not null in multi page mode. Removing.');
      settings.title = null;
    }

    if (settings.url != null) {
      __.log('URL was not null in multi page mode. Removing.');
      settings.url = null;
    }
  }

  /**
   * Called whenever the view dropdown selection changes.
   *
   * @param {view.ViewTypes} viewType - New value of the dropdown.
   */
  _handleViewDropdownChange(viewType) {
    this.viewType = viewType;
    this._refreshView();
  }

  /**
   * Show the diff view of the Page, and update the page state to NO_CHANGE.
   *
   * @param {Page} page - Page to view.
   *
   * @returns {Promise} A Promise that fulfils once the view has been updated.
   */
  _showDiff(page) {
    if (page.isChanged()) {
      page.state = Page.stateEnum.NO_CHANGE;
      page.save();
    }
    this.currentPage = page;
    this.viewType = view.ViewTypes.DIFF;
    return this._refreshView();
  }

  /**
   *
   * @param {Array<string>} idArray - Page id array.
   * @private
   */
  async _showSettings(idArray) {
    const nodeArray = idArray.map((id) =>
      createTreeForPage(id, this.pageStore));

    let newSettings;
    if (nodeArray.length === 1) {
      const node = nodeArray[0];
      if (node.isFolder) {
        newSettings = await dialog.openPageFolderDialog(node);
      } else {
        newSettings = await dialog.openPageDialog(node);
      }
    } else {
      newSettings = await dialog.openMultipleDialog(nodeArray);
    }

    if (newSettings !== null) {
      await this._updatePageList(nodeArray, newSettings);
    }

    if (nodeArray.length === 1 && !nodeArray[0].isFolder) {
      document.location.replace(getMainDiffUrl(nodeArray[0].page.id));
    } else {
      document.location.replace('about:blank');
    }
  }

  /**
   * Refresh the view, reloading any necessary HTML from storage.
   */
  async _refreshView() {
    const page = this.currentPage;

    switch (this.viewType) {
      case view.ViewTypes.OLD: {
        const html = _updateHeader(
          page,
          (await loadHtml(page, PageStore.htmlTypes.OLD)) || '',
        );
        view.viewOld(page, html);
        break;
      }

      case view.ViewTypes.NEW: {
        const html = _updateHeader(
          page,
          (await loadHtml(page, PageStore.htmlTypes.NEW)) || '',
        );
        view.viewNew(page, html);
        break;
      }

      case view.ViewTypes.DIFF:
      default: {
        const html = _updateHeader(page, await loadDiff(page));
        __.viewDiff(page, html);
      }
    }
  }
}

/**
 * Load the HTMLs of the specified page, perform a diff and return the
 * highlighted HTML.
 *
 * @param {Page} page - Page object to load.
 *
 * @returns {Promise} A promise that fulfils with the highlighted HTML string.
 */
async function loadDiff(page) {
  const oldHtml = await loadHtml(page, PageStore.htmlTypes.OLD);
  const newHtml = await loadHtml(page, PageStore.htmlTypes.NEW);
  return __.diff(page, oldHtml, newHtml);
}

/**
 * Load the specified Page HTML from the PageStore.
 *
 * @param {Page} page - Page to load.
 * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
 * type.
 * @returns {Promise} A Promise to be fulfilled with the requested HTML, or
 * null if the HTML does not exist in storage.
 */
async function loadHtml(page, htmlType) {
  const html = await PageStore.loadHtml(page.id, htmlType);

  if (html == null) {
    __.log(`Could not load '${page.title}' ${htmlType} HTML from storage`);
  }
  return html;
}

/**
 * Update the HTML header with a <base href> for the page.
 *
 * @param {Page} page - Page to update.
 * @param {string} html - HTML page content type.
 * @returns {string} Updated HTML page content.
 */
function _updateHeader(page, html) {
  // @TODO: Only add if there's no existing <base href> tag
  return `<base href="${page.url}" target="_top">` + html;
}
