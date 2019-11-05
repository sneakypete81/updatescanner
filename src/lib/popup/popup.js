import * as view from './popup_view.js';
import {openMain, showAllChanges, paramEnum, actionEnum}
  from '/lib/main/main_url.js';
import {backgroundActionEnum} from '/lib/background/actions.js';
import {createBackupJson} from '/lib/backup/backup.js';
import {openRestoreUrl} from '/lib/backup/restore_url.js';
import {getItem, getChangedPageIds} from '/lib/redux/ducks/pages.js';

/**
 * Class representing the Update Scanner toolbar popup.
 */
export class Popup {
  /**
   * @property {object} store - Redux store containing page data.
   */
  constructor() {
    this.store = new window.WebextRedux.Store();
  }

  /**
   * Initialises the popup data and event handlers.
   */
  async init() {
    view.init();
    view.bindShowAllClick(this._handleShowAllClick.bind(this));
    view.bindNewClick(this._handleNewClick.bind(this));
    view.bindSidebarClick(this._handleSidebarClick.bind(this));
    view.bindScanAllClick(this._handleScanAllClick.bind(this));
    view.bindBackupClick(this._handleBackupClick.bind(this));
    view.bindRestoreClick(this._handleRestoreClick.bind(this));
    view.bindHelpClick(this._handleHelpClick.bind(this));
    view.bindPageClick(this._handlePageClick.bind(this));

    // wait for the store to connect to the background page
    await this.store.ready();
    this._render();
    this.store.subscribe(() => this._render());
  }

  /**
   * Render the page list to show all pages in the 'changed'' state.
   */
  _render() {
    const pageIds = getChangedPageIds(this.store.getState());

    view.clearPageList();
    pageIds.map(
      (id) => view.addPage(id, getItem(this.store.getState(), id).title),
    );
  }

  /**
   * Called when the New button is clicked, to open the page to create a new
   * scan item.
   */
  async _handleNewClick() {
    const tabs = await browser.tabs.query({currentWindow: true, active: true});
    openMain({
      [paramEnum.ACTION]: actionEnum.NEW_PAGE,
      [paramEnum.TITLE]: tabs[0].title,
      [paramEnum.URL]: tabs[0].url,
    }, true);
    window.close();
  }

  /**
   * Called when the Sidebar button is clicked, to open the sidebar.
   */
  _handleSidebarClick() {
    browser.sidebarAction.open();
    window.close();
  }

  /**
   * Called when the Scan All menu item is clicked, to scan all pages.
   */
  _handleScanAllClick() {
    browser.runtime.sendMessage({action: backgroundActionEnum.SCAN_ALL});
    window.close();
  }

  /**
   * Called when the Backup menu item is clicked, to backup pages to a file.
   */
  async _handleBackupClick() {
    const blob = new Blob(
      [createBackupJson(this.pageStore)],
      {type: 'application/json'},
    );
    const url = URL.createObjectURL(blob);

    await view.downloadUrl(url, 'Update Scanner Backup.json');
    URL.revokeObjectURL(url);
  }

  /**
   * Called when the Restore menu item is clicked, to restore pages from a file.
   */
  async _handleRestoreClick() {
    openRestoreUrl();
    window.close();
  }

  /**
   * Called when the Help menu item is clicked, to open the help website.
   */
  _handleHelpClick() {
    browser.tabs.create({url:
      'https://sneakypete81.github.io/updatescanner/'});
    window.close();
  }

  /**
   * Called when the "Show All Updates" button is clicked, to open all changes
   * in new tabs.
   */
  async _handleShowAllClick() {
    await showAllChanges();
    window.close();
  }

  /**
   * Called when an item in the page list is clicked, to view that page.
   *
   * @param {string} pageId - ID of the clicked page.
   */
  _handlePageClick(pageId) {
    if (pageId !== undefined) {
      const params = {
        [paramEnum.ACTION]: actionEnum.SHOW_DIFF,
        [paramEnum.ID]: pageId,
      };
      openMain(params, true);
    }
  }
}
