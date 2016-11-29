const dataText = document.querySelector('#data');
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
      dataText.innerHTML = JSON.stringify(results, null, 4);
    })
    .catch(console.log.bind(console));
}

function preload() {
  alert('@TODO!');
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
