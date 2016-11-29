/* global Sidebar, PageStore, Page */
/* exported Main */

/**
 * Class representing the main Update Scanner content page.
 */
class Main {
  /**
   * Main constructor.
   */
  constructor() {
    this.sidebar = new Sidebar('#tree');
  }

  /**
   * Initialises the main page's sidebar and content iframe.
   */
  init() {
    this.sidebar.init();
    this.sidebar.registerSelectHandler((evt, data) =>
                                       this._onSidebarChanged(evt, data));

    const html = '<h1>Hello</h1><script src="hello.js"></script>' +
                 '<p style="margin-top:200em">Some more text</p>';
    this._loadIframe(html);
  }

  /**
   * Called by the sidebar whenever the selection changes.
   *
   * @param {Event} evt - Event that caused the selection change.
   * @param {string} data - Data associated with the new selection.
   */
  _onSidebarChanged(evt, data) {
    const selectedString = data.selected[0];
    if (selectedString.startsWith('id:')) {
      const id = selectedString.slice(3);
      this._loadHtml(id)
        .then((html) => this._loadIframe(html))
        .catch(console.log.bind(console));
    }
  }

  /**
   * Loads the specified Page HTML from the Page Store.
   *
   * @param {string} id - ID of the Page to load.
   * @returns {Promise} A Promise to be fulfilled with the requested HTML.
   */
  _loadHtml(id) {
    return PageStore.loadHtml(id, Page.pageTypes.CHANGES).then(function(html) {
      if (html === undefined) {
        throw Error('Could not load "' + id + '" changes HTML from storage');
      }
      return html;
    });
  }

  /**
   * Creates a content iframe and inserts it into the main content area.
   *
   * @param {string} html - HTML to load.
   */
  _loadIframe(html) {
    this._removeIframe();
    const iframe = document.createElement('iframe');
    iframe.id = 'frame';
    iframe.sandbox = '';
    iframe.srcdoc = html;
    document.querySelector('#main').appendChild(iframe);
  }

  /**
   * Remove the iframe from the DOM, if it exists.
   */
  _removeIframe() {
    const iframe = document.querySelector('#frame');
    if (iframe) {
      iframe.parentNode.removeChild(iframe);
    }
  }

}
