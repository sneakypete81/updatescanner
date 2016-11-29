/* global Sidebar, pageStore, Page */
/* exported Main */

class Main {
  constructor() {
    this.sidebar = new Sidebar('#tree');
  }

  init() {
    this.sidebar.init();
    this.sidebar.registerSelectHandler((evt, data) =>
                                       this.onSidebarChanged(evt, data));

    const html = '<h1>Hello</h1><script src="hello.js"></script>' +
                 '<p style="margin-top:200em">Some more text</p>';
    this.loadIframe(html);
  }

  onSidebarChanged(evt, data) {
    const selectedString = data.selected[0];
    if (selectedString.startsWith('id:')) {
      const id = selectedString.slice(3);
      this.loadHtml(id)
        .then((html) => this.loadIframe(html))
        .catch(console.log.bind(console));
    }
  }

  loadHtml(id) {
    return pageStore.loadHtml(id, Page.pageTypes.CHANGES).then(function(html) {
      if (html === undefined) {
        throw Error('Could not load "' + id + '" changes HTML from storage');
      }
      return html;
    });
  }

  loadIframe(html) {
    this.removeIframe();
    const iframe = document.createElement('iframe');
    iframe.id = 'frame';
    iframe.sandbox = '';
    iframe.srcdoc = html;
    document.querySelector('#main').appendChild(iframe);
  }

  removeIframe() {
    const iframe = document.querySelector('#frame');
    if (iframe) {
      iframe.parentNode.removeChild(iframe);
    }
  }

}
