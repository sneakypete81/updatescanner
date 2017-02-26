import * as autoscan from 'scan/autoscan';
import {PageStore, hasPageStateChanged} from 'page/page_store';
import {Page} from 'page/page';

const activeIcon = {
  18: '/images/updatescanner_18.png',
  48: '/images/updatescanner_48.png',
  64: '/images/updatescanner_64.png',
};

/**
 * Class representing the Update Scanner background process.
 */
export class Background {
  /**
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   */
  constructor() {
    this.pageStore = null;
  }

  /**
   * Start the background processes and listeners.
   */
  async init() {
    this.pageStore = await PageStore.load();
    this.pageStore.bindPageUpdate(this._handlePageUpdate.bind(this));
    this._refreshIcon();

    // @FIXME: Autoscan should take pageStore as a parameter
    autoscan.start();
  }

  /**
   * Called when a Page is updated in Storage. Refresh the icon if its state
   * changed.
   *
   * @param {string} pageId - ID of the changed Page.
   * @param {storage.StorageChange} change - Object representing the change.
   */
  _handlePageUpdate(pageId, change) {
    if (hasPageStateChanged(change)) {
      this._refreshIcon();
    }
  }

  /**
   * Refresh the browserAction icon and badge text.
   */
  _refreshIcon() {
    const updateCount = this.pageStore.getPageList()
      .filter((page) => page.state == Page.stateEnum.CHANGED)
      .length;

    browser.browserAction.setIcon({path: activeIcon});
    if (updateCount == 0) {
      browser.browserAction.setBadgeText({text: ''});
    } else {
      browser.browserAction.setBadgeText({text: updateCount.toString()});
    }
  }
}
