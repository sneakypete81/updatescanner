(function() {
  chrome.browserAction.onClicked.addListener(() => {
    const url = chrome.extension.getURL('/lib/main/main.html');
    // chrome.tabs.update({url: url})
    chrome.tabs.create({url: url});
  });
})();
