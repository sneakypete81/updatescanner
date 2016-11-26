(function(exports) {
  exports.getHtml = function(pageId, pageType) {
    const key = 'html:' + pageType + ':' + pageId;

    return browser.storage.local.get(key).then(function(result) {
      if (key in result) {
        return result[key];
      } else {
        throw Error('Could not retrieve key "' + key + '" from Storage');
      }
    });
  };
})(this.pageStore = {});
