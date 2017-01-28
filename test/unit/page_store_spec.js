import using from 'jasmine-data-provider';

import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {StorageInfo} from 'page/storage_info';
import {Storage} from 'util/storage';

describe('PageStore', function() {
  const spyOnStorageLoadWithArgReturn = (returnMap) => {
    spyOn(Storage, 'load').and.callFake(function(arg) {
      if (!(arg in returnMap)) {
        fail('Unexpected spy call: Storage.load(\'' + arg + '\')');
      }
      return returnMap[arg];
    });
  };

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
        })
        .catch((error) => done.fail(error));
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
        })
        .catch((error) => done.fail(error));
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
        })
        .catch((error) => done.fail(error));
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
      pageStore.pageMap.set('1', new PageFolder('1'));

      const pageList = pageStore.getPageList();

      expect(pageList).toEqual([]);
    });

    it('returns an array containing all Pages in the map', function() {
      const pageStore = new PageStore(new Map());
      pageStore.pageMap.set('1', new PageFolder('1'));
      pageStore.pageMap.set('2', new Page('2'));
      pageStore.pageMap.set('3', new PageFolder('3'));
      pageStore.pageMap.set('4', new Page('4'));

      const pageList = pageStore.getPageList();

      expect(pageList).toEqual([new Page('2'), new Page('4')]);
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

    it('returns undefined when the page id doesn\'t exist in storage',
       function(done) {
      const id = '42';
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
        expect(result).toBeUndefined();
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns undefined when the load operation fails', function(done) {
      const id = '42';
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MSG'));
      spyOn(console, 'log');

      PageStore.loadHtml(id, PageStore.htmlTypes.OLD).then((result) => {
        expect(result).toBeUndefined();
        expect(console.log.calls.argsFor(0)).toMatch('ERROR_MSG');
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
      spyOn(console, 'log');

      PageStore.saveHtml('2', PageStore.htmlTypes.NEW, 'Some HTML').then(() => {
        expect(console.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
