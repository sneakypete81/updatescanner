/* eslint-env jasmine */
/* global using */
/* global pageStore, PageTree, Page */

function spyOnStorageGet(result) {
  spyOn(browser.storage.local, 'get').and.returnValue(
    Promise.resolve(result));
}

describe('page_store', function() {
  beforeEach(function() {
    // sinon-chrome-webextensions currently exports 'chrome' for some reason
    /* global browser:true */
    browser = chrome;
    browser.flush();
  });

  describe('loadPageTree', function() {
    it('retrieves a PageTree from storage', function(done) {
      const pagetreeData = [1, 2, [3, 4]];
      spyOnStorageGet({pagetree: pagetreeData});

      pageStore.loadPageTree()
        .then(function(result) {
          expect(result).toEqual(jasmine.any(PageTree));
          expect(result.data).toEqual(pagetreeData);
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('returns an empty PageTree if it doesn\'t exist in storage',
       function(done) {
      spyOnStorageGet({});

      pageStore.loadPageTree()
        .then(function(result) {
          expect(result).toEqual(new PageTree({}));
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('savePageTree', function() {
    it('saves a PageTree to storage', function(done) {
      const pageTree = new PageTree([1, 2, [3, 4]]);
      spyOn(browser.storage.local, 'set').and.returnValue(
        Promise.resolve());

      pageStore.savePageTree(pageTree)
        .then(function() {
          expect(browser.storage.local.set).toHaveBeenCalledWith(
            {pagetree: pageTree.data});
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('loadPage', function() {
    it('retrieves a Page from storage', function(done) {
      const id = 12;
      const pageData = {an: 'object'};
      spyOnStorageGet({['page:' + id]: pageData});

      pageStore.loadPage(id)
        .then(function(result) {
          expect(result).toEqual(jasmine.any(Page));
          expect(result.id).toEqual(id);
          expect(result.data).toEqual(pageData);
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('returns an empty Page if it doesn\'t exist in storage', function(done) {
      const id = 13;
      spyOnStorageGet({});

      pageStore.loadPage(id)
        .then(function(result) {
          expect(result).toEqual(new Page(id, {}));
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('savePage', function() {
    it('saves a Page to storage', function(done) {
      const id = 52;
      const page = new Page(id, [1, 2, [3, 4]]);
      spyOn(browser.storage.local, 'set').and.returnValue(
        Promise.resolve());

      pageStore.savePage(page)
        .then(function() {
          expect(browser.storage.local.set).toHaveBeenCalledWith(
            {['page:' + id]: page.data});
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('loadHtml', function() {
    using([Page.pageTypes.OLD, Page.pageTypes.NEW, Page.pageTypes.CHANGES],
          function(pageType) {
      it('retrieves "' + pageType + '" HTML from storage', function(done) {
        const id = 66;
        const html = 'some HTML';
        spyOnStorageGet({['html:' + pageType + ':' + id]: html});

        pageStore.loadHtml(id, pageType)
          .then(function(result) {
            expect(result).toEqual(html);
            done();
          })
          .catch((error) => done.fail(error));
      });
    });
  });

  it('returns undefined when the page id doesn\'t exist in storage',
     function(done) {
    const id = '42';
    spyOnStorageGet({});

    pageStore.loadHtml(id, Page.pageTypes.OLD)
      .then(function(result) {
        expect(result).toBeUndefined();
        done();
      })
      .catch((error) => done.fail(error));
  });

  describe('saveHtml', function() {
    it('saves HTML to storage', function(done) {
      const id = '24';
      const html = 'some HTML..';
      spyOn(browser.storage.local, 'set').and.returnValue(
        Promise.resolve());

      pageStore.saveHtml(id, Page.pageTypes.OLD, html)
        .then(function() {
          expect(browser.storage.local.set).toHaveBeenCalledWith(
            {['html:' + Page.pageTypes.OLD + ':' + id]: html});
          done();
        })
        .catch((error) => done.fail(error));
    });
  });
});
