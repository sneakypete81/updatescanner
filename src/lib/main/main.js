import * as view from 'main/main_view';
import {paramEnum, actionEnum} from 'main/main_url';
import {Sidebar} from 'main/sidebar';
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
    this.sidebar = new Sidebar('#tree');
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

    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.registerSelectHandler((evt, data) =>
                                       this._handleSelect(evt, data));

    this._handleUrlParams(window.location.search);
  }

  /**
   * Parse and handle URL query parameters.
   *
   * @param {string} searchString - Query portion of the URL, starting with the
   * '?' character.
   */
  async _handleUrlParams(searchString) {
    const params = new URLSearchParams(searchString);
    switch (params.get(paramEnum.ACTION)) {
      case actionEnum.NEW_PAGE:
      {
        const page = await this.pageStore.createPage(PageStore.ROOT_ID);
        page.title = params.get(paramEnum.TITLE);
        page.url = params.get(paramEnum.URL);
        page.save();

        this.currentPage = page;
        view.openSettingsDialog(page);
        break;
      }
      case actionEnum.SHOW_DIFF:
      {
        this._showDiff(this.pageStore.getPage(params.get(paramEnum.ID)));
        break;
      }
    }
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {Page|PageFolder} item - Selected Page or PageFolder object.
   *
   * @returns {Promise} A Promise that fulfils once the view has been updated.
   */
  _handleSelect(item) {
    if (item instanceof Page) {
      return this._showDiff(item);
    }
  }

  /**
   * Called whenever the 'Page Settings' item is chosen from the menu.
   */
  _handleMenuSettings() {
    view.openSettingsDialog(this.currentPage);
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
    switch (this.viewType) {
      case view.ViewTypes.OLD:
      {
        const html = await loadHtml(this.currentPage,
          PageStore.htmlTypes.OLD) || '';
        view.viewOld(this.currentPage, html);
        break;
      }

      case view.ViewTypes.NEW:
      {
        const html = await loadHtml(this.currentPage,
          PageStore.htmlTypes.NEW) || '';
        view.viewNew(this.currentPage, html);
        break;
      }

      case view.ViewTypes.DIFF:
      default:
      {
        const html = await loadDiff(this.currentPage);
        view.viewDiff(this.currentPage, html);
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
