/* global using */
/* global PageStore, PageTree, Page */

function spyOnStorageGet(result) {
  spyOn(browser.storage.local, 'get').and.returnValue(
    Promise.resolve(result));
}

describe('PageStore', function() {
  beforeEach(function() {
    // sinon-chrome-webextensions currently exports 'chrome' for some reason
    /* global browser:true */
    browser = chrome;
    browser.flush();
  });

  afterEach(function() {
    /* eslint no-delete-var: 'off' */
    delete browser;
  });

  describe('loadPageTree', function() {
    it('retrieves an empty PageTree from storage', function(done) {
      const pageTreeData = {id: 0, name: 'root', children: []};
      spyOnStorageGet({pagetree: pageTreeData});

      PageStore.loadPageTree().then((result) => {
          expect(result).toEqual(jasmine.any(PageTree));
          expect(result.id).toEqual(0);
          expect(result.name).toEqual('root');
          expect(result.children).toEqual([]);
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('retrieves a PageTree containing pages from storage', function(done) {
      const pageTreeData = {id: 0, name: 'root', children: [1, 2]};
      // Expect to get a storage requrest for each element in turn
      spyOn(browser.storage.local, 'get').and.returnValues(
        Promise.resolve({pagetree: pageTreeData}),
        Promise.resolve({'page:1': {name: 'Page1'}}),
        Promise.resolve({'page:2': {name: 'Page2'}})
      );

      const promise = PageStore.loadPageTree();
      promise.then((result) => {
          // Check the PageTree root
          expect(result).toEqual(jasmine.any(PageTree));
          expect(result.id).toEqual(0);
          expect(result.name).toEqual('root');
          // Check the child pages
          expect(result.children[0]).toEqual(new Page(1, {name: 'Page1'}));
          expect(result.children[1]).toEqual(new Page(2, {name: 'Page2'}));
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('retrieves a PageTree containing a subfolder from storage',
    function(done) {
      const pageTreeData = {id: 0, name: 'root', children:
                            [1, 2,
                              {id: 3, name: 'Subfolder', children:
                               [4, 5]}]};
      // Expect to get
      spyOn(browser.storage.local, 'get').and.returnValues(
        Promise.resolve({pagetree: pageTreeData}),
        Promise.resolve({'page:1': {name: 'Page1'}}),
        Promise.resolve({'page:2': {name: 'Page2'}}),
        Promise.resolve({'page:4': {name: 'Page4'}}),
        Promise.resolve({'page:5': {name: 'Page5'}})
      );

      const promise = PageStore.loadPageTree();
      promise.then((result) => {
          // Check the PageTree root
          expect(result).toEqual(jasmine.any(PageTree));
          expect(result.id).toEqual(0);
          expect(result.name).toEqual('root');
          // Check the child pages
          expect(result.children[0]).toEqual(new Page(1, {name: 'Page1'}));
          expect(result.children[1]).toEqual(new Page(2, {name: 'Page2'}));
          // Check the subfolder
          const subfolder = result.children[2];
          expect(subfolder.id).toEqual(3);
          expect(subfolder.name).toEqual('Subfolder');
          // Check the grandchild Pages
          expect(subfolder.children[0]).toEqual(new Page(4, {name: 'Page4'}));
          expect(subfolder.children[1]).toEqual(new Page(5, {name: 'Page5'}));
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('returns an empty PageTree if it doesn\'t exist in storage',
    function(done) {
      spyOnStorageGet({});

      PageStore.loadPageTree()
        .then(function(result) {
          expect(result.id).toBeUndefined();
          expect(result.name).toBeUndefined();
          expect(result.children).toEqual([]);
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

      PageStore.savePageTree(pageTree)
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

      PageStore.loadPage(id)
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

      PageStore.loadPage(id)
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

      PageStore.savePage(page)
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

        PageStore.loadHtml(id, pageType)
          .then(function(result) {
            expect(result).toEqual(html);
            done();
          })
          .catch((error) => done.fail(error));
      });
    });

    it('returns undefined when the page id doesn\'t exist in storage',
       function(done) {
      const id = '42';
      spyOnStorageGet({});

      PageStore.loadHtml(id, Page.pageTypes.OLD)
        .then(function(result) {
          expect(result).toBeUndefined();
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('saveHtml', function() {
    it('saves HTML to storage', function(done) {
      const id = '24';
      const html = 'some HTML..';
      spyOn(browser.storage.local, 'set').and.returnValue(
        Promise.resolve());

      PageStore.saveHtml(id, Page.pageTypes.OLD, html)
        .then(function() {
          expect(browser.storage.local.set).toHaveBeenCalledWith(
            {['html:' + Page.pageTypes.OLD + ':' + id]: html});
          done();
        })
        .catch((error) => done.fail(error));
    });
  });
});
