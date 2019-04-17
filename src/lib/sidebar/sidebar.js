import {SidebarView} from './sidebar_view.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {openMain, paramEnum, actionEnum} from '/lib/main/main_url.js';
import {backgroundActionEnum} from '/lib/background/actions.js';
import {waitForMs} from '/lib/util/promise.js';

const REFRESH_TIMEOUT_MS = 200;

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
    this.sidebar = new SidebarView('#tree');
    this.pageStore = null;
    this.currentPage = null;
    this._isUpdating = false;
  }

  /**
   * Initialise the sidebar.
   */
  async init() {
    this.pageStore = await PageStore.load();
    this.pageStore.bindPageUpdate(this._handleItemUpdate.bind(this));
    this.pageStore.bindPageFolderUpdate(this._handleItemUpdate.bind(this));

    this.sidebar.init();
    this._refreshSidebar();

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
  }

  /**
   * Reload the sidebar view.
   */
  _refreshSidebar() {
    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.refresh();
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {Event} event - Event associated with the selection action.
   * @param {string} itemId - Selected Page/PageFolder ID.
   */
  _handleSelect(event, itemId) {
    const item = this.pageStore.getItem(itemId);
    if (item instanceof Page) {
      const params = {
        [paramEnum.ACTION]: actionEnum.SHOW_DIFF,
        [paramEnum.ID]: item.id,
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
    const parentPosition = this._getParentPositionOf(itemId);
    openMain({
      [paramEnum.ACTION]: actionEnum.NEW_PAGE,
      [paramEnum.PARENT_ID]: parentPosition.parentId,
      [paramEnum.INSERT_AFTER_INDEX]: parentPosition.insertAfterIndex,
    });
  }

  /**
   * Called whenever the New Folder context menu item is selected.
   *
   * @param {string} itemId - Node that was right-clicked.
   */
  _handleNewPageFolder(itemId) {
    const parentPosition = this._getParentPositionOf(itemId);
    openMain({
      [paramEnum.ACTION]: actionEnum.NEW_PAGE_FOLDER,
      [paramEnum.PARENT_ID]: parentPosition.parentId,
      [paramEnum.INSERT_AFTER_INDEX]: parentPosition.insertAfterIndex,
    });
  }

  /**
   * Called whenever the Delete context menu item is selected.
   *
   * @param {string} itemId - Page/PageFolder ID to delete.
   */
  async _handleDelete(itemId) {
    if (await this.sidebar.confirmDelete()) {
      this.pageStore.deleteItem(itemId);
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

  /**
   * Called when a Page/PageFolder is updated in Storage to refresh the sidebar.
   *
   * @param {string} itemId - ID of the changed Item.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  async _handleItemUpdate(itemId, change) {
    if (!this._isUpdating) {
      this._isUpdating = true;
      await waitForMs(REFRESH_TIMEOUT_MS);
      this._isUpdating = false;
      this._refreshSidebar();
    }
  }

  /**
   * @param {string} itemId - Sidebar item that was clicked.
   *
   * @returns {Object} Object indicating where to insert a new item.
   * Attribute parentId - Parent PageFolder of the new item.
   * Attribute insertAfterIndex - Child index of the new item.
   */
  _getParentPositionOf(itemId) {
    const item = this.pageStore.getItem(itemId);
    if (item instanceof PageFolder) {
      return {
        parentId: itemId,
        insertAfterIndex: -1,
      };
    } else {
      const parent = this.pageStore.findParent(itemId);
      return {
        parentId: parent.id,
        insertAfterIndex: parent.children.indexOf(itemId),
      };
    }
  }
}
