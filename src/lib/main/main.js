import * as view from 'main/main_view';
import * as dialog from 'main/dialog_view';
import {getMainDiffUrl, paramEnum, actionEnum} from 'main/main_url';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {diff} from 'diff/diff';
import {log} from 'util/log';

/**
 * Class representing the main Update Scanner content page.
 */
export class Main {
  /**
   * @property {Sidebar} sidebar - Object representing the sidebar element.
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
   * Initialise the main page's sidebar and content iframe.
   */
  async init() {
    this.pageStore = await PageStore.load();

    view.init();
    view.bindMenu({
      settingsHandler: this._handleMenuSettings.bind(this),
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
    switch (params.get(paramEnum.ACTION)) {
      case actionEnum.NEW_PAGE:
      {
        const title = params.get(paramEnum.TITLE);
        const url = params.get(paramEnum.URL);
        this._createNewPage(title, url);
        break;
      }
      case actionEnum.SHOW_DIFF:
      {
        this._showDiff(this.pageStore.getItem(params.get(paramEnum.ID)));
        break;
      }
    }
  }

  /**
   * _Show the Dialog to create a new Page.
   *
   * @param {string} title - Default title field.
   * @param {string} url - Default url field.
   */
  async _createNewPage(title, url) {
    if (url.startsWith('about') || url.startsWith('moz-extension')) {
      title = undefined;
      url = undefined;
    }
    // view.viewDiff(this.currentPage, '');

    const newSettings = await dialog.open({title: title, url: url});
    if (newSettings === null) {
      document.location.replace('about:blank');
    } else {
      this.currentPage = await this.pageStore.createPage(PageStore.ROOT_ID);
      this._updateCurrentPage(newSettings);
    }
  }

  /**
   * Called whenever the 'Page Settings' item is chosen from the menu.
   */
  async _handleMenuSettings() {
    const newSettings = await dialog.open(this.currentPage);
    if (newSettings !== null) {
      this._updateCurrentPage(newSettings);
    }
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
    if (page.state == Page.stateEnum.CHANGED) {
      page.state = Page.stateEnum.NO_CHANGE;
      page.save();
    }
    this.currentPage = page;
    this.viewType = view.ViewTypes.DIFF;
    return this._refreshView();
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
        view.viewDiff(page, html);
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
  return diff(page, oldHtml, newHtml);
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
    log(`Could not load '${page.title}' ${htmlType} HTML from storage`);
  }
  return html;
}

/**
 * Update the HTML header with a <base href> for the page.
 *
 * @param {Page} page - Page to update.
 * @param {string} html - HTML page content.
 * type.
 * @returns {string} Updated HTML page content.
 */
function _updateHeader(page, html) {
  // @TODO: Only add if there's no existing <base href> tag
  return `<base href="${page.url}">` + html;
}
