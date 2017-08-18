import {Sidebar2} from 'sidebar/sidebar2';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';

/**
 * Class representing the main Update Scanner content page.
 */
export class Sidebar {
  /**
   * @property {Sidebar} sidebar - Object representing the sidebar element.
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   * @property {Page} currentPage - Currently selected page.
   * @property {view.ViewTypes} viewType - Currently selected view type.
   */
  constructor() {
    this.sidebar = new Sidebar2('#tree');
    this.pageStore = null;
    this.currentPage = null;
  }

  /**
   * Initialise the sidebar.
   */
  async init() {
    this.pageStore = await PageStore.load();

    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.registerSelectHandler((evt, data) =>
                                       this._handleSelect(evt, data));
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
}
