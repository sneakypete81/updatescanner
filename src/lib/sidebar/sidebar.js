import {SidebarView} from 'sidebar/sidebar_view';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {openMain, paramEnum, actionEnum} from 'main/main_url';

const REFRESH_ALARM_ID = 'updatescanner-sidebar-refresh';
const REFRESH_ALARM_TIMING = {delayInMinutes: 0.2 / 60};

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

    // Refresh whenever the alarm goes off
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name == REFRESH_ALARM_ID) {
        this.isRefreshPending = false;
        this._refreshSidebar();
      }
    });
  }

  /**
   * Initialise the sidebar.
   */
  async init() {
    this.pageStore = await PageStore.load();
    this.pageStore.bindPageUpdate(this._handlePageUpdate.bind(this));

    this._refreshSidebar();

    this.sidebar.registerSelectHandler((pageId) => this._handleSelect(pageId));
    this.sidebar.registerRefreshDoneHandler(() => this._handleRefreshDone());
  }

  /**
   * Reload the sidebar view.
   */
  async _refreshSidebar() {
    this.isRefreshing = true;
    this.sidebar.load(this.pageStore.pageMap, PageStore.ROOT_ID);
    this.sidebar.refresh();
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
   * @param {string} pageId - Selected Page ID.
   */
  _handleSelect(pageId) {
    if (!this.isRefreshing) {
      const page = this.pageStore.getPage(pageId);
      if (page instanceof Page) {
        openMain({[paramEnum.ACTION]: actionEnum.SHOW_DIFF,
          [paramEnum.ID]: page.id});
      }
    }
  }

  /**
   * Called when a Page is updated in Storage. Refresh the sidebar if its state
   * changed.
   *
   * @param {string} pageId - ID of the changed Page.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  _handlePageUpdate(pageId, change) {
    if (!this.isRefreshPending) {
      this.isRefreshPending = true;
      browser.alarms.create(REFRESH_ALARM_ID, REFRESH_ALARM_TIMING);
    }
  }
}
