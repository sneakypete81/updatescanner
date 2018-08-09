import * as view from './main_view.js';
import * as dialog from './dialog_view.js';
import {getMainDiffUrl, paramEnum, actionEnum} from './main_url.js';
import {openDebugInfo} from '/lib/debug_info/debug_info_url.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {diff} from '/lib/diff/diff.js';
import {log} from '/lib/util/log.js';

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
        this._showDiff(this.pageStore.getItem(
          this._getUrlParam(params, paramEnum.ID)));
        break;
      }
      case actionEnum.SHOW_SETTINGS:
      {
        const item = this.pageStore.getItem(
          this._getUrlParam(params, paramEnum.ID));
        if (item instanceof Page) {
          this._showPageSettings(item);
        } else {
          this._showPageFolderSettings(item);
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
   * @param {Object} newSettings - Settings to apply to the current page.
   */
  _updateCurrentPage(newSettings) {
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
   * Show the Page settings dialog.
   *
   * @param {Page} page - Page to edit.
   */
  async _showPageSettings(page) {
    this.currentPage = page;
    const newSettings = await dialog.openPageDialog(page);
    if (newSettings !== null) {
      this._updateCurrentPage(newSettings);
    }
    document.location.replace(getMainDiffUrl(this.currentPage.id));
  }

  /**
   * Show the PgaeFolder settings dialog.
   *
   * @param {PageFolder} pageFolder - PageFolder to edit.
   */
  async _showPageFolderSettings(pageFolder) {
    const newSettings = await dialog.openPageFolderDialog(pageFolder);
    if (newSettings !== null) {
      pageFolder.title = newSettings.title;
      pageFolder.save();
    }
    document.location.replace('about:blank');
  }

  /**
   * Refresh the view, reloading any necessary HTML from storage.
   */
  async _refreshView() {
    const page = this.currentPage;

    switch (this.viewType) {
      case view.ViewTypes.OLD:
      {
        const html = _updateHeader(page,
          await loadHtml(page, PageStore.htmlTypes.OLD) || '');
        view.viewOld(page, html);
        break;
      }

      case view.ViewTypes.NEW:
      {
        const html = _updateHeader(page,
          await loadHtml(page, PageStore.htmlTypes.NEW) || '');
        view.viewNew(page, html);
        break;
      }

      case view.ViewTypes.DIFF:
      default:
      {
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

  if (html === null) {
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
