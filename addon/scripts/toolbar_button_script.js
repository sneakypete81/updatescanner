(function() {
  function openUpdateScannerMain() {
    const url = chrome.extension.getURL('/lib/main/main.html');
    // chrome.tabs.update({url: url})
    chrome.tabs.create({url: url});
  }

  chrome.browserAction.onClicked.addListener(openUpdateScannerMain);
})();
