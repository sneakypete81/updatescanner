/* eslint-env jquery */

const dataText = $('#data');
const reloadBtn = document.querySelector('#reload');
const preloadBtn = document.querySelector('#preload');
const clearBtn = document.querySelector('#clear');
const addFrm = document.querySelector('#add');

reloadBtn.addEventListener('click', reload);
preloadBtn.addEventListener('click', preload);
clearBtn.addEventListener('click', clear);
addFrm.addEventListener('submit', add);

// Display the storage contents once page is loaded
document.addEventListener('DOMContentLoaded', reload);


function reload() {
  dataText.innerHTML = '';
  browser.storage.local.get()
    .then(function(results) {
      dataText.text(JSON.stringify(results, null, 4));
    })
    .catch(console.log.bind(console));
}

function preload() {
  browser.storage.local.set({
    'pagetree': {id: 0, name: 'root', children:
                  [1, 2, {id: 3, name: 'Subfolder', children:
                    [4, 5]}]},
    'page:1': {name: 'Update Scanner Website'},
    'page:2': {name: 'Another Page'},
    'page:4': {name: 'A Website Inside a Subfolder'},
    'page:5': {name: 'The Final Site'},
    'html:changes:1': '<h1>Update Scanner Website</h1>',
    'html:changes:2': '<h1>Another Page</h1>',
    'html:changes:4': '<h1>A Website Inside a Subfolder</h1>',
    'html:changes:5': '<h1>The Final Site</h1>',
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
