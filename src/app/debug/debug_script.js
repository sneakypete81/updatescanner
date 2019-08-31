import {PageStore} from '/lib/page/page_store.js';
import {addPage} from '/lib/redux/ducks/pages.js';
import {showNotification} from '/lib/scan/notification.js';

const store = new window.WebextRedux.Store();

const dataText = document.querySelector('#data');
const preloadBtn = document.querySelector('#preload');
const addPageBtn = document.querySelector('#add-page');
const clearBtn = document.querySelector('#clear');
const notifyBtn = document.querySelector('#notify');
const addFrm = document.querySelector('#add');

preloadBtn.addEventListener('click', preload);
addPageBtn.addEventListener('click', handleAddPage);
clearBtn.addEventListener('click', clear);
notifyBtn.addEventListener('click', notify);
addFrm.addEventListener('submit', add);

// Display the storage contents once page is loaded
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // wait for the store to connect to the background page
  await store.ready();
  await render();
  store.subscribe(() => render());
}

async function render() {
  dataText.innerHTML = '';
  const storageData = await store.getState();
  dataText.textContent = JSON.stringify(storageData, null, 4);
}

async function preload() {
  await PageStore.saveHtml('1', PageStore.htmlTypes.NEW, 'This is some HTML');

  browser.storage.local.set({
    'config': {
      debug: true,
    },
    'storage_info': {
      version: 1,
      pageIds: ['1', '2', '4', '5', '6', '7', '8', '9', '10'],
      pageFolderIds: ['0', '3'],
      nextId: '6',
    },
    'page_folder:0': {title: 'root', children: ['1', '2', '3', '5']},
    'page_folder:3': {
      title: 'Subfolder',
      children: ['4', '6', '7', '8', '9', '10'],
    },
    'page:1': {
      title: 'Update Scanner Website with a very very very long title',
      url: 'https://addons.mozilla.org/firefox/addon/update-scanner/',
      state: 'changed',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:2': {
      title: 'Another Page',
      url: 'https://addons.mozilla.org/firefox/addon/update-scanner/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:4': {
      title: 'An Invalid Website Inside a Subfolder',
      url: 'https://addons.mozilla.org/thisisanerror',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:5': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:6': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:7': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:8': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:9': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
    'page:10': {
      title: 'Firefox Addons',
      url: 'https://addons.mozilla.org/',
      oldScanTime: 1486026360682,
      newScanTime: 1486631108392,
    },
  });
}

async function handleAddPage() {
  store.dispatch(addPage({
    page: {
      title: 'Test Page',
      url: 'https://www.google.com',
      status: 'changed',
    },
    parentId: 0,
  }));
}

function clear() {
  browser.storage.local.clear();
}

function add(event) {
  event.preventDefault();
  const key = event.target.querySelector('#key').value;
  const value = event.target.querySelector('#value').value;
  browser.storage.local.set({[key]: value});
}

function notify() {
  showNotification(3);
}
