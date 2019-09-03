import * as view from './main_view.js';
import * as dialog from './dialog_view.js';
import {getMainDiffUrl, paramEnum, actionEnum} from './main_url.js';
import {openDebugInfo} from '/lib/debug_info/debug_info_url.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {diff} from '/lib/diff/diff.js';
import {log} from '/lib/util/log.js';
import {
  getItem, status, editPage, isPage, isFolder,
} from '/lib/redux/ducks/pages.js';

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
   * @property {object} store - Redux store containing page data.
   * @property {string} currentPageId - Currently selected page.
   * @property {view.ViewTypes} viewType - Currently selected view type.
   */
  constructor() {
    this.store = new window.WebextRedux.Store();
    this.currentPageId = null;
    this.viewType = view.ViewTypes.DIFF;
  }

  /**
   * Initialise the main page's content iframe.
   */
  async init() {
    view.init();
    view.bindMenu({
      settingsHandler: this._handleMenuSettings.bind(this),
      debugHandler: this._handleMenuDebug.bind(this),
    });
    view.bindViewDropdownChange(this._handleViewDropdownChange.bind(this));

    dialog.init();

    // wait for the store to connect to the background page
    await this.store.ready();

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
      case actionEnum.NEW_PAGE:
      {
        this._createNewPage(
          this._getUrlParam(params, paramEnum.TITLE),
          this._getUrlParam(params, paramEnum.URL),
          this._getUrlParam(params, paramEnum.PARENT_ID),
          parseInt(this._getUrlParam(params, paramEnum.INSERT_AFTER_INDEX)),
        );
        break;
      }
      case actionEnum.NEW_PAGE_FOLDER:
      {
        this._createNewPageFolder(
          this._getUrlParam(params, paramEnum.TITLE),
          this._getUrlParam(params, paramEnum.PARENT_ID),
          parseInt(this._getUrlParam(params, paramEnum.INSERT_AFTER_INDEX)),
        );
        break;
      }
      case actionEnum.SHOW_DIFF:
      {
        this._showDiff(this._getUrlParam(params, paramEnum.ID));
        break;
      }
      case actionEnum.SHOW_SETTINGS:
      {
        const id = this._getUrlParam(params, paramEnum.ID);
        const item = getItem(this.store.getState(), id);
        if (isPage(item)) {
          this._showPageSettings(id);
        } else if (isFolder(item)) {
          this._showPageFolderSettings(id);
        }
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
   * @param {integer} insertAfterIndex - Add the page after this item in the
   * parent folder. If negative, the Page will be added to the end of the parent
   * folder.
   */
  async _createNewPage(title, url='',
                       parentId=PageStore.ROOT_ID, insertAfterIndex=-1) {
    if (url.startsWith('about') || url.startsWith('moz-extension')) {
      title = undefined;
      url = undefined;
    }

    const temporaryPage = new Page(-1, {title: title, url: url});
    const newSettings = await dialog.openPageDialog(temporaryPage);

    if (newSettings === null) {
      document.location.replace('about:blank');
    } else {
      this.currentPage = await this.pageStore.createPage(
        parentId, insertAfterIndex);
      this._updateCurrentPage(newSettings);
      // @TODO: Scan it immediately
    }
  }

  /**
   * _Show the Dialog to create a new PageFolder.
   *
   * @param {string} title - Default title field.
   * @param {string} parentId - Parent folder of the new PageFolder.
   * @param {integer} insertAfterIndex - Add the PageFolder after this item in
   * the parent folder. If negative, the PageFolder will be added to the end of
   * the parent folder.
   */
  async _createNewPageFolder(title,
                             parentId=PageStore.ROOT_ID,
                             insertAfterIndex=-1) {
    const temporaryPageFolder = new PageFolder(-1, {title: title});
    const newSettings = await dialog.openPageFolderDialog(temporaryPageFolder);
    if (newSettings !== null) {
      const pageFolder = await this.pageStore
        .createPageFolder(parentId, insertAfterIndex);
      pageFolder.title = newSettings.title;
      pageFolder.save();
    }
    document.location.replace('about:blank');
  }

  /**
   * Called whenever the 'Page Settings' item is chosen from the menu.
   */
  _handleMenuSettings() {
    this._showPageSettings(this.currentPageId);
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
    this.currentPage.title = newSettings.title;
    this.currentPage.url = newSettings.url;
    this.currentPage.scanRateMinutes = newSettings.scanRateMinutes;
    this.currentPage.changeThreshold = newSettings.changeThreshold;
    this.currentPage.ignoreNumbers = newSettings.ignoreNumbers;
    this.currentPage.save();

    document.location.replace(getMainDiffUrl(this.currentPage.id));
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
   * @param {string} pageId - ID of the Page to view.
   */
  async _showDiff(pageId) {
    const page = getItem(this.store.getState(), pageId);
    if (page.status == status.CHANGED) {
      this.store.dispatch(editPage(pageId, {status: status.NO_CHANGE}));
    }
    this.currentPageId = pageId;
    this.viewType = view.ViewTypes.DIFF;
    await this._refreshView();
  }

  /**
   * Show the Page settings dialog.
   *
   * @param {string} pageId - ID of the Page to edit.
   */
  async _showPageSettings(pageId) {
    this.currentPageId = pageId;
    const page = getItem(this.store.getState(), pageId);

    const newSettings = await dialog.openPageDialog(page);
    if (newSettings !== null) {
      await this.store.dispatch(editPage(pageId, newSettings));
    }
    document.location.replace(getMainDiffUrl(this.currentPageId));
  }

  /**
   * Show the PageFolder settings dialog.
   *
   * @param {PageFolder} pageFolder - PageFolder to edit.
   */
  async _showPageFolderSettings(pageFolder) {
    const newSettings = await dialog.openPageFolderDialog(pageFolder);
    if (newSettings !== null) {
      const updatedPageFolder = await PageFolder.load(pageFolder.id);
      updatedPageFolder.title = newSettings.title;
      updatedPageFolder.save();
    }
    document.location.replace('about:blank');
  }

  /**
   * Refresh the view, reloading any necessary HTML from storage.
   */
  async _refreshView() {
    const pageId = this.currentPageId;
    const page = getItem(this.store.getState(), pageId);

    switch (this.viewType) {
      case view.ViewTypes.OLD:
      {
        const rawHtml = await loadHtml(
          pageId, page.title, PageStore.htmlTypes.OLD) || '';
        const html = _updateHeader(page.url, rawHtml);
        view.viewOld(page, html);
        break;
      }

      case view.ViewTypes.NEW:
      {
        const rawHtml = await loadHtml(
          pageId, page.title, PageStore.htmlTypes.NEW) || '';
        const html = _updateHeader(page.url, rawHtml);
        view.viewNew(page, html);
        break;
      }

      case view.ViewTypes.DIFF:
      default:
      {
        const rawHtml = await loadDiff(pageId, page.title);
        const html = _updateHeader(page.url, rawHtml);
        __.viewDiff(page, html);
      }
    }
  }
}

/**
 * Load the HTMLs of the specified page, perform a diff and return the
 * highlighted HTML.
 *
 * @param {string} pageId - ID of the Page to load.
 * @param {string} title - Title of the Page to load.
 *
 * @returns {Promise} A promise that fulfils with the highlighted HTML string.
 */
async function loadDiff(pageId, title) {
  const oldHtml = await loadHtml(pageId, title, PageStore.htmlTypes.OLD);
  const newHtml = await loadHtml(pageId, title, PageStore.htmlTypes.NEW);
  return __.diff(oldHtml, newHtml);
}

/**
 * Load the specified Page HTML from the PageStore.
 *
 * @param {string} pageId - ID of the Page to load.
 * @param {string} title - Title of the Page to load.
 * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
 * type.
 * @returns {Promise} A Promise to be fulfilled with the requested HTML, or
 * null if the HTML does not exist in storage.
 */
async function loadHtml(pageId, title, htmlType) {
  const html = await PageStore.loadHtml(pageId, htmlType);

  if (html === null) {
    __.log(`Could not load '${title}' ${htmlType} HTML from storage`);
  }
  return html;
}

/**
 * Update the HTML header with a <base href> for the page.
 *
 * @param {string} url - URL of the page.
 * @param {string} html - HTML page content type.
 * @returns {string} Updated HTML page content.
 */
function _updateHeader(url, html) {
  // @TODO: Only add if there's no existing <base href> tag
  return `<base href="${url}" target="_top">` + html;
}
