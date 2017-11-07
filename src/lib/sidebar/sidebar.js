import {SidebarView} from 'sidebar/sidebar_view';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {openMain, paramEnum, actionEnum} from 'main/main_url';
import {waitForMs} from 'util/promise';

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
    this.isRefreshPending = false;
    this.isRefreshing = false;
  }

  /**
   * Initialise the sidebar.
   */
  async init() {
    this.pageStore = await PageStore.load();
    this.pageStore.bindPageUpdate(this._handlePageUpdate.bind(this));

    this._refreshSidebar();

    this.sidebar.registerSelectHandler((itemId) => this._handleSelect(itemId));
    this.sidebar.registerNewPageHandler((itemId) =>
      this._handleNewPage(itemId));
    this.sidebar.registerNewPageFolderHandler((itemId) =>
      this._handleNewPageFolder(itemId));
    this.sidebar.registerDeleteHandler((itemId) => this._handleDelete(itemId));
    this.sidebar.registerMoveHandler((itemId, pageFolderId, position) =>
      this._handleMove(itemId, pageFolderId, position));
    this.sidebar.registerSettingsHandler((itemId) =>
      this._handleSettings(itemId));
    this.sidebar.registerRefreshDoneHandler(() => this._handleRefreshDone());
  }

  /**
   * Reload the sidebar view.
   */
  _refreshSidebar() {
    this.isRefreshPending = false;
    this.isRefreshing = true;
    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.refresh();

    if (this.pageStore.getPageList().length == 0) {
      this.sidebar.showUpgradeText();
    } else {
      this.sidebar.hideUpgradeText();
    }
  }

  /**
   * Called when a sidebar refresh is complete.
   */
  _handleRefreshDone() {
    this.isRefreshing = false;
  }

  /**
   * Called whenever a single item in the sidebar is selected.
   *
   * @param {string} itemId - Selected Page/PageFolder ID.
   */
  _handleSelect(itemId) {
    if (!this.isRefreshing) {
      const item = this.pageStore.getItem(itemId);
      if (item instanceof Page) {
        openMain({[paramEnum.ACTION]: actionEnum.SHOW_DIFF,
          [paramEnum.ID]: item.id});
      }
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
  _handleDelete(itemId) {
    if (this.sidebar.confirmDelete()) {
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
   * Called when a Page is updated in Storage. Refresh the sidebar if its state
   * changed.
   *
   * @param {string} pageId - ID of the changed Page.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  async _handlePageUpdate(pageId, change) {
    if (!this.isRefreshPending) {
      this.isRefreshPending = true;
      await waitForMs(REFRESH_TIMEOUT_MS);
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
