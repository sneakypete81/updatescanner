/* exported Main */

class Main {
  constructor(Sidebar) {
    this.sidebar = new Sidebar('#tree');
  }

  load() {
    this.sidebar.load();
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
    const key = 'html:' + id;
    return browser.storage.local.get(key).then(function(result) {
      if (key in result) {
        return result[key];
      } else {
        throw Error('Could not retrieve key "' + key + '" from Storage');
      }
    });
  }

  loadIframe(html) {
    this.clearIframe();
    const iframe = document.createElement('iframe');
    iframe.id = 'frame';
    iframe.sandbox = '';
    iframe.srcdoc = html;
    document.querySelector('#main').appendChild(iframe);
  }

  clearIframe() {
    const iframe = document.querySelector('#frame');
    if (iframe) {
      iframe.parentNode.removeChild(iframe);
    }
  }

}
