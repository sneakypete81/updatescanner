import using from 'jasmine-data-provider';

import {PageStore, hasPageStateChanged} from 'page/page_store';
import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {StorageInfo} from 'page/storage_info';
import {Storage} from 'util/storage';
import * as log from 'util/log';

describe('PageStore', function() {
  const spyOnStorageLoadWithArgReturn = (returnMap) => {
    spyOn(Storage, 'load').and.callFake(function(arg) {
      if (!(arg in returnMap)) {
        fail('Unexpected spy call: Storage.load(\'' + arg + '\')');
      }
      return returnMap[arg];
    });
  };

  beforeEach(function() {
    spyOn(Storage, 'addListener').and.callFake((listener) => {
      this.storageListener = listener;
    });
  });

  describe('load', function() {
    it('retrieves an empty pageMap from storage', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({pageIds: [], pageFolderIds: []}),
      });

      PageStore.load().then((pageStore) => {
        expect(pageStore.pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root'}));
        expect(pageStore.pageMap.size).toEqual(1);
        done();
      }).catch((error) => done.fail(error));
    });

    it('retrieves a pageMap containing pages from storage', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({pageIds: ['1', '2'],
                                             pageFolderIds: []}),
        [Page._KEY('1')]: Promise.resolve({title: 'Page 1'}),
        [Page._KEY('2')]: Promise.resolve({title: 'Page 2'}),
      });

      PageStore.load().then((pageStore) => {
        expect(pageStore.pageMap.get('1')).toEqual(
          new Page('1', {title: 'Page 1'}));
        expect(pageStore.pageMap.get('2')).toEqual(
          new Page('2', {title: 'Page 2'}));
        expect(pageStore.pageMap.size).toEqual(2);
        done();
      }).catch((error) => done.fail(error));
    });

    it('retrieves a pageMap containing a subfolder from storage',
       function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({pageIds: ['1', '2'],
                                             pageFolderIds: ['0', '3']}),
        [Page._KEY('1')]: Promise.resolve({title: 'Page 1'}),
        [Page._KEY('2')]: Promise.resolve({title: 'Page 2'}),
        [PageFolder._KEY('0')]: Promise.resolve(
          {title: 'root', children: ['1', '3']}),
        [PageFolder._KEY('3')]: Promise.resolve(
          {title: 'subfolder', children: ['2']}),
      });

      PageStore.load().then((pageStore) => {
        expect(pageStore.pageMap.get('1')).toEqual(
          new Page('1', {title: 'Page 1'}));
        expect(pageStore.pageMap.get('2')).toEqual(
          new Page('2', {title: 'Page 2'}));
        expect(pageStore.pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root', children: ['1', '3']}));
        expect(pageStore.pageMap.get('3')).toEqual(
          new PageFolder('3', {title: 'subfolder', children: ['2']}));
        expect(pageStore.pageMap.size).toEqual(4);
        done();
      }).catch((error) => done.fail(error));
    });

    it('remembers the StorageInfo object after loading', function(done) {
      const storageInfo = {pageIds: [], pageFolderIds: []};
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve(storageInfo),
      });

      PageStore.load().then((pageStore) => {
        expect(pageStore.storageInfo).toEqual(new StorageInfo(storageInfo));
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('_generatePageMap', function() {
    it('returns an empty map if there are no Pages or PageFolders',
       function(done) {
      PageStore._generatePageMap([], []).then((pageMap) => {
        expect(pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root'}));
        expect(pageMap.size).toEqual(1);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('generates a map with a single page', function(done) {
      spyOnStorageLoadWithArgReturn({
        [Page._KEY('1')]: Promise.resolve({title: 'Page 1'}),
      });

      PageStore._generatePageMap(['1'], []).then((pageMap) => {
        expect(pageMap.get('1')).toEqual(new Page('1', {title: 'Page 1'}));
        expect(pageMap.size).toEqual(1);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('generates a map with a single folder', function(done) {
      spyOnStorageLoadWithArgReturn({
        [PageFolder._KEY('1')]: Promise.resolve(
                                {title: 'Folder1', children: ['2']}),
      });

      PageStore._generatePageMap([], ['1']).then((pageMap) => {
        expect(pageMap.get('1')).toEqual(new PageFolder('1',
          {title: 'Folder1', children: ['2']}));
        expect(pageMap.size).toEqual(1);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('generates a map with pages and folders', function(done) {
      spyOnStorageLoadWithArgReturn({
        [PageFolder._KEY('1')]: Promise.resolve(
                                {title: 'Folder1', children: ['2', '3']}),
        [Page._KEY('2')]: Promise.resolve({title: 'Page2'}),
        [PageFolder._KEY('3')]: Promise.resolve(
                                {title: 'Folder3', children: ['4']}),
        [Page._KEY('4')]: Promise.resolve({title: 'Page4'}),
      });

      PageStore._generatePageMap(['2', '4'], ['1', '3']).then((pageMap) => {
        expect(pageMap.get('1')).toEqual(new PageFolder('1',
          {title: 'Folder1', children: ['2', '3']}));
        expect(pageMap.get('2')).toEqual(new Page('2', {title: 'Page2'}));
        expect(pageMap.get('3')).toEqual(new PageFolder('3',
          {title: 'Folder3', children: ['4']}));
        expect(pageMap.get('4')).toEqual(new Page('4', {title: 'Page4'}));
        expect(pageMap.size).toEqual(4);
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('getPageList', function() {
    it('returns an empty array when there are no Pages in the map', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new PageFolder('1', {}));

      const pageList = pageStore.getPageList();

      expect(pageList).toEqual([]);
    });

    it('returns an array containing all Pages in the map', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new PageFolder('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {}));
      pageStore.pageMap.set('4', new Page('4', {}));

      const pageList = pageStore.getPageList();

      expect(pageList).toEqual([new Page('2', {}), new Page('4', {})]);
    });
  });

  describe('createPage', function() {
    it('creates a new page at the tree root', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const pageStore = new PageStore(
        PageStore.ROOT_PAGE_MAP, new StorageInfo());

      pageStore.createPage(PageStore.ROOT_ID).then((page) => {
        expect(page.id).toEqual('1');
        expect(pageStore.pageMap.get('1')).toEqual(page);

        const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
        expect(rootFolder.children).toContain('1');

        expect(Storage.save).toHaveBeenCalledWith(
          PageFolder._KEY('0'), rootFolder._toObject());
        expect(Storage.save).toHaveBeenCalledWith(
          StorageInfo._KEY, pageStore.storageInfo._toObject());
        done();
      });
    });

    it('creates a new page in a subfolder', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const subFolder = new PageFolder('1', {});
      const pageStore = new PageStore(
        PageStore.ROOT_PAGE_MAP, new StorageInfo({nextId: '2'}));
      pageStore.pageMap.set('1', subFolder);

      pageStore.createPage('1').then((page) => {
        expect(page.id).toEqual('2');
        expect(pageStore.pageMap.get('2')).toEqual(page);

        expect(subFolder.children).toContain('2');

        expect(Storage.save).toHaveBeenCalledWith(
          PageFolder._KEY('1'), subFolder._toObject());
        expect(Storage.save).toHaveBeenCalledWith(
          StorageInfo._KEY, pageStore.storageInfo._toObject());
        done();
      });
    });
  });

  describe('loadHtml', function() {
    using([PageStore.htmlTypes.OLD,
           PageStore.htmlTypes.NEW,
           PageStore.htmlTypes.CHANGES,
          ], function(pageType) {
      it('retrieves "' + pageType + '" HTML from storage', function(done) {
        const id = 66;
        const html = 'some HTML';
        spyOn(Storage, 'load').and.returnValues(Promise.resolve(html));

        PageStore.loadHtml(id, pageType).then((result) => {
          expect(Storage.load).toHaveBeenCalledWith(
            PageStore._HTML_KEY(id, pageType));
          expect(result).toEqual(html);
          done();
        })
        .catch((error) => done.fail(error));
      });
    });

    it('returns null when the page HTML doesn\'t exist in storage',
       function(done) {
      const id = '42';
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
        expect(result).toBeNull();
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns null when the load operation fails', function(done) {
      const id = '42';
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MSG'));
      spyOn(log, 'log');

      PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
        expect(result).toBeNull();
        expect(log.log.calls.argsFor(0)).toMatch('ERROR_MSG');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('saveHtml', function() {
    it('saves HTML to storage', function(done) {
      const id = '24';
      const html = 'some HTML..';
      const htmlType = PageStore.htmlTypes.OLD;
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.saveHtml(id, htmlType, html).then(() => {
        expect(Storage.save).toHaveBeenCalledWith(
          PageStore._HTML_KEY(id, htmlType), html);
        done();
      }).catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(log, 'log');

      PageStore.saveHtml('2', PageStore.htmlTypes.NEW, 'Some HTML').then(() => {
        expect(log.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('bindPageUpdate', function() {
    it('calls the handler when a Page update event fires', function() {
      const pageStore = new PageStore(new Map(), {});
      this.pageIds = [];
      this.changes = [];

      pageStore.bindPageUpdate((pageId, change) => {
        this.pageIds.push(pageId);
        this.changes.push(change);
      });

      this.storageListener({[Page._KEY('23')]: 'Change!'});

      expect(this.pageIds).toEqual(['23']);
      expect(this.changes).toEqual(['Change!']);
    });

    it('calls the handler twice when a double Page update event fires',
      function() {
      const pageStore = new PageStore(new Map(), {});
      this.pageIds = [];
      this.changes = [];

      pageStore.bindPageUpdate((pageId, change) => {
        this.pageIds.push(pageId);
        this.changes.push(change);
      });

      this.storageListener({
        [Page._KEY('23')]: 'Change!',
        [Page._KEY('34')]: 'Another change',
      });

      expect(this.pageIds).toEqual(['23', '34']);
      expect(this.changes).toEqual(['Change!', 'Another change']);
    });

    it('doesn\'t call the handler when a non-Page update event fires',
    function() {
      const pageStore = new PageStore(new Map(), {});
      const updateHandler = jasmine.createSpy('updateHandler');
      pageStore.bindPageUpdate(updateHandler);

      this.storageListener({['invalidKey:1']: 'Change!'});

      expect(updateHandler).not.toHaveBeenCalled();
    });
  });

  describe('_addStorageListener', function() {
    it('adds a page to the pageMap when a new Page event fires',
      function() {
      const page = new Page('1', {title: 'NewTitle'});

      const pageStore = new PageStore(new Map(), {});

      this.storageListener({
        [Page._KEY('1')]: {newValue: page._toObject()},
      });

      expect(pageStore.getPageList()).toEqual([page]);
    });

    it('updates the pageMap when a Page update event fires', function() {
      const originalPage = new Page('1', {});
      const updatedPage = new Page('1', {title: 'Changed Title'});

      const pageStore = new PageStore(new Map(), {});
      pageStore.pageMap.set('1', originalPage);

      this.storageListener({
        [Page._KEY('1')]: {newValue: updatedPage._toObject()},
      });

      expect(pageStore.getPageList()).toEqual([updatedPage]);
    });

    it('doesn\'t update the pageMap when a non-Page event fires', function() {
      const page = new Page('1', {title: 'NewTitle'});

      const pageStore = new PageStore(new Map(), {});

      this.storageListener({
        ['invalidKey: 1']: {newValue: page._toObject()},
      });

      expect(pageStore.getPageList()).toEqual([]);
    });
  });
});

describe('hasPageStateChanged', function() {
  it('returns true if the page state changed', function() {
    const change = {
      oldValue: {state: 'NO_CHANGE'},
      newValue: {state: 'CHANGE'},
    };
    expect(hasPageStateChanged(change)).toEqual(true);
  });

  it('returns false if the page state has not changed', function() {
    const change = {
      oldValue: {state: 'CHANGE'},
      newValue: {state: 'CHANGE'},
    };
    expect(hasPageStateChanged(change)).toEqual(false);
  });

  it('returns true if the page was deleted', function() {
    const change = {
      oldValue: {state: 'NO_CHANGE'},
    };
    expect(hasPageStateChanged(change)).toEqual(true);
  });

  it('returns true if the page was added', function() {
    const change = {
      newValue: {state: 'CHANGE'},
    };
    expect(hasPageStateChanged(change)).toEqual(true);
  });

  it('returns true if the change is not specified', function() {
    const change = {};
    expect(hasPageStateChanged(change)).toEqual(true);
  });
});
