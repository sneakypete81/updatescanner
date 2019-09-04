import {SidebarView} from './sidebar_view.js';
import {openMain, paramEnum, actionEnum} from '/lib/main/main_url.js';
import {backgroundActionEnum} from '/lib/background/actions.js';
import {getItem, deleteItem, isPage} from '/lib/redux/ducks/pages.js';

/**
 * Class representing the main Update Scanner content page.
 */
export class Sidebar {
  /**
   * @property {object} store - Redux store containing page data.
   * @property {Sidebar} sidebar - Object representing the sidebar element.
   * @property {Page} currentPage - Currently selected page.
   * @property {view.ViewTypes} viewType - Currently selected view type.
   */
  constructor() {
    this.store = new window.WebextRedux.Store();
    this.sidebar = new SidebarView('#tree');
    this.pageStore = null;
    this.currentPage = null;
    this._isUpdating = false;
  }

  /**
   * Initialise the sidebar.
   */
  async init() {
    this.sidebar.init();
    this.sidebar.registerSelectHandler((event, itemId) =>
      this._handleSelect(event, itemId));
    this.sidebar.registerNewPageHandler((itemId) =>
      this._handleNewPage(itemId));
    this.sidebar.registerNewPageFolderHandler((itemId) =>
      this._handleNewPageFolder(itemId));
    this.sidebar.registerDeleteHandler((itemId) => this._handleDelete(itemId));
    this.sidebar.registerMoveHandler((itemId, pageFolderId, position) =>
      this._handleMove(itemId, pageFolderId, position));
    this.sidebar.registerScanItemHandler((itemId) =>
      this._handleScanItem(itemId));
    this.sidebar.registerSettingsHandler((itemId) =>
      this._handleSettings(itemId));

    // wait for the store to connect to the background page
    await this.store.ready();
    await this.sidebar.render(this.store);
    this.store.subscribe(() => this.sidebar.render(this.store));
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {Event} event - Event associated with the selection action.
   * @param {string} itemId - Selected Page/PageFolder ID.
   */
  _handleSelect(event, itemId) {
    const item = getItem(this.store.getState(), itemId);
    if (isPage(item)) {
      const params = {
        [paramEnum.ACTION]: actionEnum.SHOW_DIFF,
        [paramEnum.ID]: itemId,
      };

      const newTab = event.metaKey || event.ctrlKey || (event.button == 1);
      openMain(params, newTab);
    }
  }

  /**
   * Called whenever the New Page context menu item is selected.
   *
   * @param {string} itemId - Node that was right-clicked.
   */
  _handleNewPage(itemId) {
    openMain({
      [paramEnum.ACTION]: actionEnum.NEW_PAGE,
      [paramEnum.INSERT_AFTER]: itemId,
    });
  }

  /**
   * Called whenever the New Folder context menu item is selected.
   *
   * @param {string} itemId - Node that was right-clicked.
   */
  _handleNewPageFolder(itemId) {
    openMain({
      [paramEnum.ACTION]: actionEnum.NEW_PAGE_FOLDER,
      [paramEnum.INSERT_AFTER]: itemId,
    });
  }

  /**
   * Called whenever the Delete context menu item is selected.
   *
   * @param {string} itemId - Page/PageFolder ID to delete.
   */
  async _handleDelete(itemId) {
    if (await this.sidebar.confirmDelete()) {
      this.store.dispatch(deleteItem(itemId));
    }
  }

  /**
   * Called whenever an item is moved due to a DnD operation.
   *
   * @param {string} itemId - ID of the item to move.
   * @param {string} pageFolderId - ID of the destination PageFolder.
   * @param {integer} position - Position within the destination PageFolder.
   */
  _handleMove(itemId, pageFolderId, position) {
    this.pageStore.moveItem(itemId, pageFolderId, position);
  }

  /**
   * Called whenever the Scan context menu item is selected.
   *
   * @param {string} itemId - Page/PageFolder ID.
   */
  _handleScanItem(itemId) {
    browser.runtime.sendMessage({
      action: backgroundActionEnum.SCAN_ITEM,
      itemId: itemId,
    });
  }

  /**
   * Called whenever the Settings context menu item is selected.
   *
   * @param {string} itemId - Page/PageFolder ID.
   */
  _handleSettings(itemId) {
    openMain({
      [paramEnum.ACTION]: actionEnum.SHOW_SETTINGS,
      [paramEnum.ID]: itemId,
    });
  }
}
