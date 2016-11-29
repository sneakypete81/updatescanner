/* global PageTree, Page */

// @TODO: convert to class with static methods?

(function(exports) {
  const pageTreeKey = 'pagetree';
  const pageKey = (pageId) => 'page:' + pageId;
  const htmlKey = (pageType, pageId) => 'html:' + pageId + ':' + pageType;

  const saveData = function(key, data) {
    return browser.storage.local.set({[key]: data})
      .catch((error) => console.log.bind(console));
  };

  const loadData = function(key) {
    return browser.storage.local.get(key).then(function(result) {
      if (key in result) {
        return result[key];
      } else {
        return undefined;
      }
    });
  };

  exports.savePageTree = function(pageTree) {
    return saveData(pageTreeKey, pageTree.data);
  };

  exports.loadPageTree = function() {
    // Return a promise that first loads the PageTree data
    return loadData(pageTreeKey).then(function(data) {
      if (data === undefined) {
        data = {};
      }
      // Then load the child Pages of the PageTree
      return new PageTree().deserialise(data, exports.loadPage);
    })
    .catch((error) => console.log.bind(console));
  };

  exports.savePage = function(page) {
    return saveData(pageKey(page.id), page.data);
  };

  exports.loadPage = function(pageId) {
    return loadData(pageKey(pageId)).then(function(data) {
      if (data === undefined) {
        data = {};
      }
      return new Page(pageId, data);
    }).catch((error) => console.log.bind(console));
  };

  exports.saveHtml = function(pageId, pageType, html) {
    return saveData(htmlKey(pageId, pageType), html);
  };

  exports.loadHtml = function(pageId, pageType) {
    return loadData(htmlKey(pageId, pageType))
      .catch((error) => console.log.bind(console));
  };
})(this.pageStore = {});
