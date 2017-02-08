import * as view from 'main/main_view';
import {paramEnum, actionEnum} from 'main/main_url';
import {Sidebar} from 'main/sidebar';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {diff} from 'diff/diff';

/**
 * Class representing the main Update Scanner content page.
 */
export class Main {
  /**
   * @property {Sidebar} sidebar - Object representing the sidebar element.
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   */
  constructor() {
    this.sidebar = new Sidebar('#tree');
    this.pageStore = undefined;
  }

  /**
   * Initialises the main page's sidebar and content iframe.
   */
  init() {
    PageStore.load().then((pageStore) => {
      this.pageStore = pageStore;
      view.bindMenu();

      this.sidebar.load(pageStore.pageMap, PageStore.ROOT_ID);
      this.sidebar.registerSelectHandler((evt, data) =>
                                         this._handleSelect(evt, data));

      this._handleUrlParams(window.location.search);
    });
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
        break;

      case actionEnum.SHOW_DIFF:
      {
        const page = this.pageStore.getPage(params.get(paramEnum.ID));
        this._viewDiff(page);
        break;
      }
    }
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {Page|PageFolder} item - Selected Page or PageFolder object.
   */
  _handleSelect(item) {
    if (item instanceof Page) {
      this._viewDiff(item);
    }
  }

  /**
   * View the page as a diff. Load the HTMLs of the specified page, perform a
   * diff, then insert it into the iframe.
   *
   * @param {type} page - Page object to view.
   */
  _viewDiff(page) {
    this._loadHtml(page.id, PageStore.htmlTypes.OLD).then((oldHtml) => {
      this._loadHtml(page.id, PageStore.htmlTypes.NEW).then((newHtml) => {
        const diffHtml = diff(page, oldHtml, newHtml);
        view.viewDiff(page, diffHtml);
      });
    }).catch(console.log.bind(console));
  }

  /**
   * Loads the specified Page HTML from the PageStore.
   *
   * @param {string} id - ID of the Page to load.
   * @param {string} htmlType - PageStore.htmlTypes string identifying the HTML
   * type.
   * @returns {Promise} A Promise to be fulfilled with the requested HTML.
   */
  _loadHtml(id, htmlType) {
    return PageStore.loadHtml(id, htmlType)
      .then(function(html) {
        if (html === undefined) {
          throw Error('Could not load "' + id + '" changes HTML from storage');
        }
        return html;
      });
  }
}
