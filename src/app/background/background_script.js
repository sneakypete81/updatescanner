import * as autoscan from 'scan/autoscan';

// Handle the toolbar button click event
(function() {
  chrome.browserAction.onClicked.addListener(() => {
    const url = chrome.extension.getURL('/app/main/main.html');
    // chrome.tabs.update({url: url})
    chrome.tabs.create({url: url});
  });
})();

// Run the Autoscan process in the background
(function() {
  autoscan.start();
})();
