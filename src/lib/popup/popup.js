import {openMain, paramEnum, actionEnum} from 'main/main_url';
/**
 * Class representing the Update Scanner toolbar popup.
 */
export class Popup {
  /**
   * Initialises the popup data and event handlers.
   */
  init() {
    document.querySelector('#new')
      .addEventListener('click', Popup._handleClickNew);
    document.querySelector('#sidebar')
      .addEventListener('click', Popup._handleClickSidebar);

    // @TODO: register on list creation
    document.querySelector('#id1')
      .addEventListener('click', Popup._handleClickListItem);
    document.querySelector('#id2')
      .addEventListener('click', Popup._handleClickListItem);
    document.querySelector('#id3')
      .addEventListener('click', Popup._handleClickListItem);
  }

  /**
   * Called when the New button is clicked, to open the page to create a new
   * scan item.
   *
   * @param {Event} event - Click event.
   */
  static _handleClickNew(event) {
    openMain({[paramEnum.ACTION]: actionEnum.NEW});
    window.close();
  }

  /**
   * Called when the Sidebar button is clicked, to open the sidebar.
   *
   * @param {Event} event - Click event.
   */
  static _handleClickSidebar(event) {
    // @TODO: Use sidebar API rather than just opening the main page.
    openMain();
  }

  /**
   * Called when an item in the page list is clicked, to view that page.
   *
   * @param {Event} event - Click event.
   */
  static _handleClickListItem(event) {
    const pageId = event.currentTarget.dataset.id;
    if (pageId !== undefined) {
      openMain({[paramEnum.ACTION]: actionEnum.DIFF,
        [paramEnum.ID]: pageId});
    }
  }
}
