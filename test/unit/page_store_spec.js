// import using from
//    '/test/dependencies/include/jasmine-data-provider/src/index.js';
/* global using */

import {PageStore, hasPageStateChanged} from '/lib/page/page_store.js';
import * as pageStoreModule from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {StorageInfo} from '/lib/page/storage_info.js';
import {Storage} from '/lib/util/storage.js';
import {StorageDB} from '/lib/util/storage_db.js';

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
    it('creates an empty pageMap if it isn\'t found in storage',
      function(done) {
        spyOnStorageLoadWithArgReturn({
          [StorageInfo._KEY]: Promise.resolve(undefined),
        });

        PageStore.load().then((pageStore) => {
          expect(pageStore.pageMap.get('0')).toEqual(
            new PageFolder('0', {title: 'root'}));
          expect(pageStore.pageMap.size).toEqual(1);
          expect(pageStore.storageInfo.pageFolderIds).toEqual(['0']);
          done();
        }).catch((error) => done.fail(error));
      }
    );

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
        [StorageInfo._KEY]: Promise.resolve(
          {pageIds: ['1', '2'], pageFolderIds: ['0']}),
        [PageFolder._KEY('0')]: Promise.resolve(
          {title: 'root', children: ['1', '2']}),
        [Page._KEY('1')]: Promise.resolve({title: 'Page 1'}),
        [Page._KEY('2')]: Promise.resolve({title: 'Page 2'}),
      });

      PageStore.load().then((pageStore) => {
        expect(pageStore.pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root', children: ['1', '2']}));
        expect(pageStore.pageMap.get('1')).toEqual(
          new Page('1', {title: 'Page 1'}));
        expect(pageStore.pageMap.get('2')).toEqual(
          new Page('2', {title: 'Page 2'}));
        expect(pageStore.pageMap.size).toEqual(3);
        done();
      }).catch((error) => done.fail(error));
    });

    it('retrieves a pageMap containing a subfolder from storage',
      function(done) {
        spyOnStorageLoadWithArgReturn({
          [StorageInfo._KEY]: Promise.resolve(
            {pageIds: ['1', '2'], pageFolderIds: ['0', '3']}),
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
        [PageFolder._KEY('0')]: Promise.resolve(
          {title: 'root', children: ['1']}),
        [Page._KEY('1')]: Promise.resolve({title: 'Page 1'}),
      });

      PageStore._generatePageMap(['1'], ['0']).then((pageMap) => {
        expect(pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root', children: ['1']}));
        expect(pageMap.get('1')).toEqual(new Page('1', {title: 'Page 1'}));
        expect(pageMap.size).toEqual(2);
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('generates a map with a single folder', function(done) {
      spyOnStorageLoadWithArgReturn({
        [PageFolder._KEY('0')]: Promise.resolve(
          {title: 'root', children: ['1']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {title: 'Folder1', children: ['2']}),
      });

      PageStore._generatePageMap([], ['0', '1']).then((pageMap) => {
        expect(pageMap.get('0')).toEqual(
          new PageFolder('0', {title: 'root', children: ['1']}));
        expect(pageMap.get('1')).toEqual(new PageFolder('1',
          {title: 'Folder1', children: ['2']}));
        expect(pageMap.size).toEqual(2);
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('generates a map with pages and folders', function(done) {
      spyOnStorageLoadWithArgReturn({
        [PageFolder._KEY('0')]: Promise.resolve(
          {title: 'root', children: ['1']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {title: 'Folder1', children: ['2', '3']}),
        [Page._KEY('2')]: Promise.resolve({title: 'Page2'}),
        [PageFolder._KEY('3')]: Promise.resolve(
          {title: 'Folder3', children: ['4']}),
        [Page._KEY('4')]: Promise.resolve({title: 'Page4'}),
      });

      PageStore._generatePageMap(['2', '4'], ['0', '1', '3'])
        .then((pageMap) => {
          expect(pageMap.get('0')).toEqual(
            new PageFolder('0', {title: 'root', children: ['1']}));
          expect(pageMap.get('1')).toEqual(new PageFolder('1',
            {title: 'Folder1', children: ['2', '3']}));
          expect(pageMap.get('2')).toEqual(new Page('2', {title: 'Page2'}));
          expect(pageMap.get('3')).toEqual(new PageFolder('3',
            {title: 'Folder3', children: ['4']}));
          expect(pageMap.get('4')).toEqual(new Page('4', {title: 'Page4'}));
          expect(pageMap.size).toEqual(5);
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

  describe('getChangedPageList', function() {
    it('returns an empty array when there are no Pages in the map',
      function() {
        const pageStore = new PageStore(new Map());
        pageStore.pageMap.set('1',
          new PageFolder('1', {state: Page.stateEnum.NO_CHANGE}));

        const pageList = pageStore.getChangedPageList();

        expect(pageList).toEqual([]);
      });

    it('returns an array containing all changed Pages in the map', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1',
        new PageFolder('1', {state: Page.stateEnum.NO_CHANGE}));
      pageStore.pageMap.set('2',
        new Page('2', {state: Page.stateEnum.CHANGED}));
      pageStore.pageMap.set('3',
        new PageFolder('3', {state: Page.stateEnum.CHANGED}));
      pageStore.pageMap.set('4',
        new Page('4', {state: Page.stateEnum.NO_CHANGE}));
      pageStore.pageMap.set('5',
        new Page('5', {state: Page.stateEnum.CHANGED}));

      const pageList = pageStore.getChangedPageList();
      expect(pageList).toEqual(
        [pageStore.getItem('2'), pageStore.getItem('5')]);
    });
  });

  describe('getPageFolderList', function() {
    it('returns just the root when there are no other PageFolders in the map',
      function() {
        const pageStore = new PageStore(new Map());
        const root = new PageFolder('1', {});
        pageStore.pageMap.set(root.id, root);

        const pageFolderList = pageStore.getPageFolderList();

        expect(pageFolderList).toEqual([root]);
      }
    );

    it('returns an array containing all PageFolders in the map', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new PageFolder('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {}));
      pageStore.pageMap.set('4', new Page('4', {}));

      const pageList = pageStore.getPageFolderList();

      expect(pageList)
        .toEqual([new PageFolder('1', {}), new PageFolder('3', {})]);
    });
  });

  describe('isPageFolderId', function() {
    it('returns true if the item is a PageFolder', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new PageFolder('1', {}));

      const isFolder = pageStore.isPageFolderId('1');

      expect(isFolder).toBeTruthy();
    });

    it('returns false if the item is a Page', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new Page('1', {}));

      const isFolder = pageStore.isPageFolderId('1');

      expect(isFolder).toBeFalsy();
    });
  });

  describe('findParent', function() {
    it('returns the parent of a Page', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('1', {children: ['2', '3']});
      pageStore.pageMap.set('1', root);
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {children: ['4']}));
      pageStore.pageMap.set('4', new Page('4', {}));

      const parent = pageStore.findParent('2');

      expect(parent).toEqual(root);
    });

    it('returns the parent of a PageFolder', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('1', {children: ['2', '3']});
      pageStore.pageMap.set('1', root);
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {children: ['4']}));
      pageStore.pageMap.set('4', new Page('4', {}));

      const parent = pageStore.findParent('3');

      expect(parent).toEqual(root);
    });

    it('returns undefined if the item doesn\'t exist', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('2', new Page('2', {}));

      const parent = pageStore.findParent('3');

      expect(parent).toBeUndefined();
    });

    it('returns undefined if the item doesn\'t have a parent', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('2', new Page('2', {}));

      const parent = pageStore.findParent('2');

      expect(parent).toBeUndefined();
    });
  });

  describe('createPage', function() {
    it('creates a new Page at the tree root', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve(undefined),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      const page = await pageStore.createPage(PageStore.ROOT_ID);

      expect(page.id).toEqual('1');

      const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
      expect(rootFolder.children).toContain('1');

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('0'), rootFolder._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });

    it('creates a new Page in a subfolder', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({nextId: '2'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      const subFolder = new PageFolder('1', {});
      pageStore.pageMap.set('1', subFolder);

      const page = await pageStore.createPage('1');

      expect(page.id).toEqual('2');

      expect(subFolder.children).toContain('2');

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('1'), subFolder._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });

    it('creates a new Page between other Pages in a subfolder',
      async function() {
        spyOnStorageLoadWithArgReturn({
          [StorageInfo._KEY]: Promise.resolve({nextId: '2'}),
        });
        spyOn(Storage, 'save').and.returnValues(Promise.resolve());

        const pageStore = await PageStore.load();
        const subFolder = new PageFolder('1', {children: ['11', '22', '33']});
        pageStore.pageMap.set('1', subFolder);

        const page = await pageStore.createPage('1', 1);

        expect(page.id).toEqual('2');

        expect(subFolder.children).toEqual(['11', '22', '2', '33']);

        expect(Storage.save).toHaveBeenCalledWith(
          PageFolder._KEY('1'), subFolder._toObject());
        expect(Storage.save).toHaveBeenCalledWith(
          StorageInfo._KEY, pageStore.storageInfo._toObject());
      });

    it('deletes any residual stored HTML when reusing a page ID?',
      async function() {
        spyOnStorageLoadWithArgReturn({
          [StorageInfo._KEY]: Promise.resolve(undefined),
        });
        spyOn(Storage, 'save').and.returnValues(Promise.resolve());
        spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

        const pageStore = await PageStore.load();
        const page = await pageStore.createPage(PageStore.ROOT_ID);

        expect(page.id).toEqual('1');

        expect(StorageDB.remove).toHaveBeenCalledWith(
          PageStore._HTML_KEY('1', PageStore.htmlTypes.OLD));
        expect(StorageDB.remove).toHaveBeenCalledWith(
          PageStore._HTML_KEY('1', PageStore.htmlTypes.NEW));
      });
  });

  describe('createPageFolder', function() {
    it('creates a new PageFolder at the tree root', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve(undefined),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.createPageFolder(PageStore.ROOT_ID).then((pageFolder) => {
          expect(pageFolder.id).toEqual('1');

          const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
          expect(rootFolder.children).toContain('1');

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('0'), rootFolder._toObject());
          expect(Storage.save).toHaveBeenCalledWith(
            StorageInfo._KEY, pageStore.storageInfo._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });

    it('creates a new pageFolder in a subfolder', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({nextId: '2'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        const subFolder = new PageFolder('1', {});
        pageStore.pageMap.set('1', subFolder);

        pageStore.createPageFolder('1').then((pageFolder) => {
          expect(pageFolder.id).toEqual('2');

          expect(subFolder.children).toContain('2');

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('1'), subFolder._toObject());
          expect(Storage.save).toHaveBeenCalledWith(
            StorageInfo._KEY, pageStore.storageInfo._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });
  });

  describe('deleteItem', function() {
    it('deletes an existing Page', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve(
          {pageFolderIds: ['0'], pageIds: ['1']}),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['3', '1', '4']}),
        [Page._KEY('1')]: Promise.resolve(
          {id: '1'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());
      spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      await pageStore.deleteItem('1');

      expect(pageStore.storageInfo.pageIds).toEqual([]);

      const root = pageStore.getItem('0');
      expect(root.children).toEqual(['3', '4']);

      expect(Storage.remove).toHaveBeenCalledWith(Page._KEY('1'));

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('0'), root._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });

    it('deletes an empty PageFolder', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({pageFolderIds: ['0', '1']}),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['3', '1', '4']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: []}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());
      spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      await pageStore.deleteItem('1');

      expect(pageStore.storageInfo.pageFolderIds).toEqual(['0']);

      const root = pageStore.getItem('0');
      expect(root.children).toEqual(['3', '4']);

      expect(Storage.remove).toHaveBeenCalledWith(PageFolder._KEY('1'));

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('0'), root._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });

    it('deletes a PageFolder with sub-folders', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0', '1', '2'],
          pageIds: ['5'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['3', '1', '4']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: ['2']}),
        [PageFolder._KEY('2')]: Promise.resolve(
          {id: '2', children: ['5']}),
        [Page._KEY('5')]: Promise.resolve(
          {id: '5'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());
      spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      await pageStore.deleteItem('1');

      expect(pageStore.storageInfo.pageFolderIds).toEqual(['0']);
      expect(pageStore.storageInfo.pageIds).toEqual([]);

      const root = pageStore.getItem('0');
      expect(root.children).toEqual(['3', '4']);

      expect(Storage.remove).toHaveBeenCalledWith(PageFolder._KEY('1'));
      expect(Storage.remove).toHaveBeenCalledWith(PageFolder._KEY('2'));
      expect(Storage.remove).toHaveBeenCalledWith(Page._KEY('5'));

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('0'), root._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });

    it('does nothing if the item doesn\'t exist', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve(
          {pageFolderIds: ['0'], pageIds: ['1']}),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['3', '1', '4']}),
        [Page._KEY('1')]: Promise.resolve({id: '1'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      await pageStore.deleteItem('2');

      expect(pageStore.storageInfo.pageIds).toEqual(['1']);

      const root = pageStore.getItem('0');
      expect(root.children).toEqual(['3', '1', '4']);
    });

    it('doesn\'t delete the root, only all children', async function() {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: [PageStore.ROOT_ID, '1', '2'],
          pageIds: ['5'],
        }),
        [PageFolder._KEY(PageStore.ROOT_ID)]: Promise.resolve(
          {id: PageStore.ROOT_ID, children: ['1']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: ['2']}),
        [PageFolder._KEY('2')]: Promise.resolve(
          {id: '2', children: ['5']}),
        [Page._KEY('5')]: Promise.resolve(
          {id: '5'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());
      spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

      const pageStore = await PageStore.load();
      await pageStore.deleteItem(PageStore.ROOT_ID);

      expect(pageStore.storageInfo.pageFolderIds).toEqual([PageStore.ROOT_ID]);
      expect(pageStore.storageInfo.pageIds).toEqual([]);

      const root = pageStore.getItem(PageStore.ROOT_ID);
      expect(root.children).toEqual([]);

      expect(Storage.remove).toHaveBeenCalledWith(PageFolder._KEY('1'));
      expect(Storage.remove).toHaveBeenCalledWith(PageFolder._KEY('2'));
      expect(Storage.remove).toHaveBeenCalledWith(Page._KEY('5'));

      expect(Storage.save).toHaveBeenCalledWith(
        PageFolder._KEY('0'), root._toObject());
      expect(Storage.save).toHaveBeenCalledWith(
        StorageInfo._KEY, pageStore.storageInfo._toObject());
    });
  });

  describe('refreshFolderState', function() {
    it('updates folder state if children\'s state becomes changed', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {
        children: ['1', '2'], state: PageFolder.stateEnum.NO_CHANGE});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {
        state: Page.stateEnum.NO_CHANGE}));
      pageStore.pageMap.set('2', new PageFolder('2', {
        children: ['3'], state: PageFolder.stateEnum.NO_CHANGE}));
      pageStore.pageMap.set('3', new Page('3', {
        state: Page.stateEnum.CHANGED}));

      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      pageStore.refreshFolderState();
      expect(Storage.save).toHaveBeenCalledTimes(2);
      expect(pageStore.getItem('0').isChanged()).toBeTruthy();
      expect(pageStore.getItem('1').isChanged()).toBeFalsy();
      expect(pageStore.getItem('2').isChanged()).toBeTruthy();
      expect(pageStore.getItem('3').isChanged()).toBeTruthy();
    });

    it('updates folder state if children\'s state becomes unchanged',
      function() {
        const pageStore = new PageStore(new Map());
        const root = new PageFolder('0', {
          children: ['1', '2'], state: PageFolder.stateEnum.CHANGED});
        pageStore.pageMap.set('0', root);
        pageStore.pageMap.set('1', new Page('1', {
          state: Page.stateEnum.NO_CHANGE}));
        pageStore.pageMap.set('2', new PageFolder('2', {
          children: ['3'], state: PageFolder.stateEnum.CHANGED}));
        pageStore.pageMap.set('3', new Page('3', {
          state: Page.stateEnum.NO_CHANGE}));

        spyOn(Storage, 'save').and.returnValues(Promise.resolve());

        pageStore.refreshFolderState();
        expect(Storage.save).toHaveBeenCalledTimes(2);
        expect(pageStore.getItem('0').isChanged()).toBeFalsy();
        expect(pageStore.getItem('1').isChanged()).toBeFalsy();
        expect(pageStore.getItem('2').isChanged()).toBeFalsy();
        expect(pageStore.getItem('3').isChanged()).toBeFalsy();
      });

    it('does nothing if folder state is correct', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {
        children: ['1', '2'], state: PageFolder.stateEnum.CHANGED});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {
        state: Page.stateEnum.CHANGED}));
      pageStore.pageMap.set('2', new PageFolder('2', {
        children: ['3'], state: PageFolder.stateEnum.NO_CHANGE}));
      pageStore.pageMap.set('3', new Page('3', {
        state: Page.stateEnum.NO_CHANGE}));

      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      pageStore.refreshFolderState();
      expect(Storage.save).not.toHaveBeenCalled();
      expect(pageStore.getItem('0').isChanged()).toBeTruthy();
      expect(pageStore.getItem('1').isChanged()).toBeTruthy();
      expect(pageStore.getItem('2').isChanged()).toBeFalsy();
      expect(pageStore.getItem('3').isChanged()).toBeFalsy();
    });
  });

  describe('moveItem', function() {
    it('moves a Page forward within the root', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0'],
          pageIds: ['5', '6', '7'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['5', '6', '7']}),
        [Page._KEY('5')]: Promise.resolve({id: '5'}),
        [Page._KEY('6')]: Promise.resolve({id: '6'}),
        [Page._KEY('7')]: Promise.resolve({id: '7'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.moveItem('5', PageStore.ROOT_ID, 3).then(() => {
          const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
          expect(rootFolder.children).toEqual(['6', '7', '5']);

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('0'), rootFolder._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });

    it('moves a Page backward within the root', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0'],
          pageIds: ['5', '6', '7'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['5', '6', '7']}),
        [Page._KEY('5')]: Promise.resolve({id: '5'}),
        [Page._KEY('6')]: Promise.resolve({id: '6'}),
        [Page._KEY('7')]: Promise.resolve({id: '7'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.moveItem('7', PageStore.ROOT_ID, 0).then(() => {
          const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
          expect(rootFolder.children).toEqual(['7', '5', '6']);

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('0'), rootFolder._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });

    it('moves a Page from root to PageFolder', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0', '1'],
          pageIds: ['5', '6', '7'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['1', '5', '6']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: ['7']}),
        [Page._KEY('5')]: Promise.resolve({id: '5'}),
        [Page._KEY('6')]: Promise.resolve({id: '6'}),
        [Page._KEY('7')]: Promise.resolve({id: '7'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.moveItem('5', '1', 0).then(() => {
          const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
          expect(rootFolder.children).toEqual(['1', '6']);
          const pageFolder = pageStore.pageMap.get('1');
          expect(pageFolder.children).toEqual(['5', '7']);

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('0'), rootFolder._toObject());
          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('1'), pageFolder._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });

    it('moves a Page from PageFolder to root', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0', '1'],
          pageIds: ['5', '6', '7'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['1', '5', '6']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: ['7']}),
        [Page._KEY('5')]: Promise.resolve({id: '5'}),
        [Page._KEY('6')]: Promise.resolve({id: '6'}),
        [Page._KEY('7')]: Promise.resolve({id: '7'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.moveItem('7', '0', 2).then(() => {
          const rootFolder = pageStore.pageMap.get(PageStore.ROOT_ID);
          expect(rootFolder.children).toEqual(['1', '5', '7', '6']);
          const pageFolder = pageStore.pageMap.get('1');
          expect(pageFolder.children).toEqual([]);

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('0'), rootFolder._toObject());
          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('1'), pageFolder._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });

    it('moves a PageFolder within another PageFolder', function(done) {
      spyOnStorageLoadWithArgReturn({
        [StorageInfo._KEY]: Promise.resolve({
          pageFolderIds: ['0', '1', '2'],
          pageIds: ['5', '6', '7'],
        }),
        [PageFolder._KEY('0')]: Promise.resolve(
          {id: '0', children: ['1', '5', '6']}),
        [PageFolder._KEY('1')]: Promise.resolve(
          {id: '1', children: ['2', '7']}),
        [PageFolder._KEY('2')]: Promise.resolve(
          {id: '2', children: []}),
        [Page._KEY('5')]: Promise.resolve({id: '5'}),
        [Page._KEY('6')]: Promise.resolve({id: '6'}),
        [Page._KEY('7')]: Promise.resolve({id: '7'}),
      });
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      PageStore.load().then((pageStore) => {
        pageStore.moveItem('2', '1', 2).then(() => {
          const pageFolder = pageStore.pageMap.get('1');
          expect(pageFolder.children).toEqual(['7', '2']);

          expect(Storage.save).toHaveBeenCalledWith(
            PageFolder._KEY('1'), pageFolder._toObject());
          done();
        }).catch((error) => done.fail(error));
      }).catch((error) => done.fail(error));
    });
  });

  describe('getDescendantPages', function() {
    it('returns an empty list if there are no pages', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {children: []});
      pageStore.pageMap.set('0', root);

      const descendants = pageStore.getDescendantPages('0');

      expect(descendants).toEqual([]);
    });

    it('returns a list of all children', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {children: ['1', '2']});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));

      const descendants = pageStore.getDescendantPages('0');

      expect(descendants).toEqual([
        pageStore.getItem('1'),
        pageStore.getItem('2'),
      ]);
    });

    it('returns a list of all children and grandchildren', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {children: ['1', '2', '3']});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {children: ['4', '5']}));
      pageStore.pageMap.set('4', new Page('4', {}));
      pageStore.pageMap.set('5', new Page('5', {}));

      const descendants = pageStore.getDescendantPages('0');

      expect(descendants).toEqual([
        pageStore.getItem('1'),
        pageStore.getItem('2'),
        pageStore.getItem('4'),
        pageStore.getItem('5'),
      ]);
    });

    it('returns a list of all children of a subfolder', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {children: ['1', '2', '3']});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {children: ['4', '5']}));
      pageStore.pageMap.set('4', new Page('4', {}));
      pageStore.pageMap.set('5', new Page('5', {}));

      const descendants = pageStore.getDescendantPages('3');

      expect(descendants).toEqual([
        pageStore.getItem('4'),
        pageStore.getItem('5'),
      ]);
    });

    it('returns the page when passed a page ID', function() {
      const pageStore = new PageStore(new Map());
      const root = new PageFolder('0', {children: ['1', '2', '3']});
      pageStore.pageMap.set('0', root);
      pageStore.pageMap.set('1', new Page('1', {}));
      pageStore.pageMap.set('2', new Page('2', {}));
      pageStore.pageMap.set('3', new PageFolder('3', {children: ['4', '5']}));
      pageStore.pageMap.set('4', new Page('4', {}));
      pageStore.pageMap.set('5', new Page('5', {}));

      const descendants = pageStore.getDescendantPages('5');

      expect(descendants).toEqual([
        pageStore.getItem('5'),
      ]);
    });
  });

  describe('loadHtml', function() {
    using([
      PageStore.htmlTypes.OLD,
      PageStore.htmlTypes.NEW,
      PageStore.htmlTypes.CHANGES,
    ], function(pageType) {
      it('retrieves "' + pageType + '" HTML from storage', function(done) {
        const id = 66;
        const html = 'some HTML';
        spyOn(StorageDB, 'load').and.returnValues(Promise.resolve(html));

        PageStore.loadHtml(id, pageType).then((result) => {
          expect(StorageDB.load).toHaveBeenCalledWith(
            PageStore._HTML_KEY(id, pageType));
          expect(result).toEqual(html);
          done();
        }).catch((error) => done.fail(error));
      });
    });

    it('returns null when the page HTML doesn\'t exist in storage',
      function(done) {
        const id = '42';
        spyOn(StorageDB, 'load').and.returnValues(Promise.resolve(undefined));

        PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
          expect(result).toBeNull();
          done();
        }).catch((error) => done.fail(error));
      });

    it('returns null when the load operation fails', function(done) {
      const id = '42';
      spyOn(StorageDB, 'load').and
        .returnValues(Promise.reject(new Error('ERROR_MSG')));
      spyOn(pageStoreModule.__, 'log');

      PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
        expect(result).toBeNull();
        expect(pageStoreModule.__.log.calls.argsFor(0)).toMatch('ERROR_MSG');
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('saveHtml', function() {
    it('saves HTML to storage', function(done) {
      const id = '24';
      const html = 'some HTML..';
      const htmlType = PageStore.htmlTypes.OLD;
      spyOn(StorageDB, 'save').and.returnValues(Promise.resolve());

      PageStore.saveHtml(id, htmlType, html).then(() => {
        expect(StorageDB.save).toHaveBeenCalledWith(
          PageStore._HTML_KEY(id, htmlType), html);
        done();
      }).catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(StorageDB, 'save').and
        .returnValues(Promise.reject(new Error('AN_ERROR')));
      spyOn(pageStoreModule.__, 'log');

      PageStore.saveHtml('2', PageStore.htmlTypes.NEW, 'Some HTML').then(() => {
        expect(pageStoreModule.__.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('deleteHtml', function() {
    it('deletes HTML from storage', function(done) {
      const id = '24';
      spyOn(StorageDB, 'remove').and.returnValues(Promise.resolve());

      PageStore.deleteHtml(id).then(() => {
        expect(StorageDB.remove).toHaveBeenCalledWith(
          PageStore._HTML_KEY(id, PageStore.htmlTypes.OLD));
        expect(StorageDB.remove).toHaveBeenCalledWith(
          PageStore._HTML_KEY(id, PageStore.htmlTypes.NEW));
        done();
      }).catch((error) => done.fail(error));
    });

    it('silently logs an error if the delete operation fails', function(done) {
      spyOn(StorageDB, 'remove').and
        .returnValues(Promise.reject(new Error('AN_ERROR')));
      spyOn(pageStoreModule.__, 'log');

      PageStore.deleteHtml('2').then(() => {
        expect(pageStoreModule.__.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      }).catch((error) => done.fail(error));
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

    it('calls the handler when a PageFolder update event fires', function() {
      const pageStore = new PageStore(new Map(), {});
      this.folderIds = [];
      this.changes = [];

      pageStore.bindPageFolderUpdate((folderId, change) => {
        this.folderIds.push(folderId);
        this.changes.push(change);
      });

      this.storageListener({[PageFolder._KEY('23')]: 'Change!'});

      expect(this.folderIds).toEqual(['23']);
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

    it('adds a page folder to the pageMap when a new PageFolder event fires',
      function() {
        const pageFolder = new PageFolder('1', {title: 'NewTitle'});

        const pageStore = new PageStore(new Map(), {});

        this.storageListener({
          [PageFolder._KEY('1')]: {newValue: pageFolder._toObject()},
        });

        expect(pageStore.pageMap).toEqual(new Map([['1', pageFolder]]));
      });

    it('updates the pageMap when a PageFolder update event fires', function() {
      const originalPageFolder = new PageFolder('1', {});
      const updatedPageFolder = new PageFolder('1', {title: 'Changed Title'});

      const pageStore = new PageStore(new Map(), {});
      pageStore.pageMap.set('1', originalPageFolder);

      this.storageListener({
        [PageFolder._KEY('1')]: {newValue: updatedPageFolder._toObject()},
      });

      expect(pageStore.pageMap).toEqual(new Map([['1', updatedPageFolder]]));
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
