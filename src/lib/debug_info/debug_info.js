import {paramEnum} from './debug_info_url.js';
import * as view from './debug_info_view.js';
import {PageStore} from '/lib/page/page_store.js';

/**
 * Class representing the Debug Info page.
 */
export class DebugInfo {
  /**
   * @property {Page} page - Page object that we're viewing.
   */
  constructor() {
    this.page = null;
    this.view = null;
    this.oldHtml = null;
    this.newHtml = null;
  }

  /**
   * Initialise the page content.
   */
  async init() {
    const id = this._getUrlId(window.location.search);

    const pageStore = await PageStore.load();
    this.page = pageStore.getItem(id);

    view.bind({
      downloadNewHandler: this._handleDownloadNew.bind(this),
      downloadOldHandler: this._handleDownloadOld.bind(this),
    });

    this.showInfo();
  }

  /**
   * Parse and handle URL query parameters.
   *
   * @param {string} searchString - Query portion of the URL, starting with the
   * '?' character.
   *
   * @returns {string} - Page ID from the URL.
   */
  _getUrlId(searchString) {
    const params = new URLSearchParams(searchString);
    return params.get(paramEnum.ID);
  }

  /**
   * Display debug info for the page.
   */
  async showInfo() {
    this.oldHtml = await PageStore.loadHtml(
      this.page.id, PageStore.htmlTypes.OLD) || '';
    this.newHtml = await PageStore.loadHtml(
      this.page.id, PageStore.htmlTypes.NEW) || '';

    view.update(this.page, this.oldHtml, this.newHtml);
  }

  /**
   * Download the Old HTML for the page.
   */
  _handleDownloadOld() {
    this._download(this.oldHtml, this.page.title + '-old.html');
  }

  /**
   * Download the New HTML for the page.
   */
  _handleDownloadNew() {
    this._download(this.newHtml, this.page.title + '-new.html');
  }

  /**
    * @param {string} html - HTML data to download.
    * @param {string} filename - Filename to use for the download.
    */
  async _download(html, filename) {
    const blob = new Blob(
      [html],
      {type: 'text/html'}
    );
    const url = URL.createObjectURL(blob);
    await view.downloadUrl(url, filename);
    URL.revokeObjectURL(url);

  }
}
