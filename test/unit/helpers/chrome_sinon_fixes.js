// sinon-chrome doesn't implement browser.storage promises correctly yet,
// so override the stub to allow a custom spy
chrome.storage = {local: {get: null, set: null}};
