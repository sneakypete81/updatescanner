// @TODO: Don't need JQuery
import $ from 'jquery';

import {PageStore} from 'page/page_store';

import {showNotification} from 'scan/notification';

const dataText = $('#data');
const reloadBtn = document.querySelector('#reload');
const preloadBtn = document.querySelector('#preload');
const clearBtn = document.querySelector('#clear');
const notifyBtn = document.querySelector('#notify');
const addFrm = document.querySelector('#add');

reloadBtn.addEventListener('click', reload);
preloadBtn.addEventListener('click', preload);
clearBtn.addEventListener('click', clear);
notifyBtn.addEventListener('click', notify);
addFrm.addEventListener('submit', add);

// Display the storage contents once page is loaded
document.addEventListener('DOMContentLoaded', reload);


async function reload() {
  dataText.innerHTML = '';
  const storageData = await browser.storage.local.get();
  dataText.text(JSON.stringify(storageData, null, 4));

  const storageDBData = await PageStore.loadHtml('1', PageStore.htmlTypes.NEW);
  dataText.text(JSON.stringify(storageDBData, null, 4));
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
    'html:old:1': '<h1>Update Scanner Website</h1>',
    'html:new:1': '<h1>Update Scanner Website With Changed Text</h1>',
    'html:old:2': '<h1>Another Page</h1>',
    'html:new:2': '<h1>Another Page with Changed Text</h1>',
    'html:new:4': '<h1>An invalid Website In a Subfolder with no OLD HTML</h1>',
    'html:old:5': '<h1>The Final Site</h1>',
    'html:new:5': '<h1>The Final Site with Changed Text</h1>',
    });
    reload();
}

function clear() {
  browser.storage.local.clear();
  reload();
}

function add(event) {
  event.preventDefault();
  const key = event.target.querySelector('#key').value;
  const value = event.target.querySelector('#value').value;
  browser.storage.local.set({[key]: value});
  reload();
}

function notify() {
  showNotification(3);
}
