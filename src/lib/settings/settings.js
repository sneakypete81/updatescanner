import * as view from 'settings/settings_view';
import {paramEnum} from 'settings/settings_url';
import {Page} from 'page/page';

/**
 * Class representing the Page Settings dialog.
 */
export class Settings {
  /**
   * @property {Page} page - Page object being edited.
   */
  constructor() {
    this.page = undefined;
  }

  /**
   * Initialise the Page Settings dialog with the Page specified in the URL.
   */
  async init() {
    view.init();
    view.bindValueInput(this._handleValueInput.bind(this));

    const params = new URLSearchParams(window.location.search);
    const pageId = params.get(paramEnum.ID);
    this.page = await Page.load(pageId);
    view.update(this.page);
  }

  /**
   * Called when a dialog input is modified, to update the Page object.
   *
   * @param {string} key - Page attribute that was modified.
   * @param {type} value - New value of the attribute.
   */
  _handleValueInput(key, value) {
    this.page[key] = value;
    this.page.save();
  }
}
