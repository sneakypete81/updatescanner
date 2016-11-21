/* global Sidebar */

document.addEventListener('DOMContentLoaded', init);


function init() {
  const sidebar = new Sidebar('#tree');
  sidebar.init();
  sidebar.handleSelection(onSidebarChanged);

  const html = '<h1>Hello</h1><script src="hello.js"></script>' +
               '<p style="margin-top:200em">Some more text</p>';
  loadIframe(html);
}

function onSidebarChanged(evt, data) {
  const selectedString = data.selected[0];
  if (selectedString.startsWith('id:')) {
    const id = selectedString.slice(3);
    loadHtml(id)
      .then(loadIframe)
      .catch(console.log.bind(console));
  }
}

function loadHtml(id) {
  const key = 'html:' + id;
  return browser.storage.local.get(key).then(function(result) {
    if (key in result) {
      return result[key];
    } else {
      throw Error('Could not retrieve key "' + key + '" from Storage');
    }
  });
}

function loadIframe(html) {
  clearIframe();
  const iframe = document.createElement('iframe');
  iframe.id = 'frame';
  iframe.sandbox = '';
  iframe.srcdoc = html;
  document.querySelector('#main').appendChild(iframe);
}

function clearIframe() {
  const iframe = document.querySelector('#frame');
  if (iframe) {
    iframe.parentNode.removeChild(iframe);
  }
}

// $(".sidebar").height(Math.max($(".content").height(),
//                               $(".sidebar").height()));
