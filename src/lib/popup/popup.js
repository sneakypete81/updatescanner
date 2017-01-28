import {openMain, paramEnum, actionEnum} from 'main/main_url';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';

/**
 * Class representing the Update Scanner toolbar popup.
 */
export class Popup {
  /**
   * @property {PageStore} pageStore - Object used for saving and loading data
   * from storage.
   */
  constructor() {
    this.pageStore = undefined;
  }

  /**
   * Initialises the popup data and event handlers.
   */
  init() {
    document.querySelector('#new')
      .addEventListener('click', Popup._handleClickNew);
    document.querySelector('#sidebar')
      .addEventListener('click', Popup._handleClickSidebar);

    PageStore.load().then((pageStore) => {
      this.pageStore = pageStore;
      this._refreshPageList();
    });
  }

  /**
   * Add any pages with CHANGED state to the page list.
   */
  _refreshPageList() {
    for (const page of this.pageStore.getPageList()) {
      if (page.state == Page.stateEnum.CHANGED) {
        document.querySelector('#list').appendChild(createListItem(page));
      }
    }
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

/**
 * Create a new list item for a Page.
 *
 * @param {Page} page - Page object to use for the list item.
 *
 * @returns {Element} List item for the given Page.
 */
function createListItem(page) {
  const item = document.createElement('div');
  item.className = 'panel-list-item';
  item.dataset.id = page.id;

  const icon = document.createElement('div');
  icon.className = 'icon';
  const image = document.createElement('img');
  image.src = '/images/updatescanner_18.png';
  icon.appendChild(image);

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = page.title;

  item.appendChild(icon);
  item.appendChild(text);
  item.addEventListener('click', Popup._handleClickListItem);
  return item;
}
