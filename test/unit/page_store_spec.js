/* eslint-env jasmine */
/* global using */
/* global pageStore, Page */

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

  describe('getHtml', function() {
    using([Page.pageTypes.OLD, Page.pageTypes.NEW, Page.pageTypes.CHANGES],
          function(pageType) {
      it('retrieves "' + pageType + '" HTML from storage', function(done) {
        const id = 66;
        const html = 'some HTML';
        spyOnStorageGet({['html:' + pageType + ':' + id]: html});

        pageStore.getHtml(id, pageType)
          .then(function(result) {
            expect(result).toBe(html);
            done();
          })
          .catch((error) => done.fail(error));
      });
    });
  });

  it('fails when the page id doesn\'t exist in storage', function(done) {
    const id = '42';
    spyOnStorageGet({});

    pageStore.getHtml(id, Page.pageTypes.OLD)
      .then(function(result) {
        done.fail('getHtml unexpectedly returned a successful promise.');
      })
      .catch((error) => done());
  });
});
