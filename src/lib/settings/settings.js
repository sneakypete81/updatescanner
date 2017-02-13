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

    const params = new URLSearchParams(window.location.search);
    const pageId = params.get(paramEnum.ID);
    this.page = await Page.load(pageId);
    view.update(this.page);
  }
}
