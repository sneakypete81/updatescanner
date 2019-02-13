import {StorageInfo} from '/lib/page/storage_info.js';
import * as storageInfoModule from '/lib/page/storage_info.js';
import {Storage} from '/lib/util/storage.js';

describe('StorageInfo', function() {
  beforeEach(function() {
    spyOn(Storage, 'addListener').and.callFake((listener) => {
      this.storageListener = listener;
    });
  });

  describe('load', function() {
    it('loads StorageInfo from storage', function(done) {
      const data = {
        version: 99,
        pageIds: ['1', '2', '3'],
        pageFolderIds: ['0', '4'],
        nextId: '5',
      };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      StorageInfo.load().then((storageInfo) => {
        expect(Storage.load).toHaveBeenCalledWith(StorageInfo._KEY);
        expect(storageInfo.version).toEqual(data.version);
        expect(storageInfo.pageIds).toEqual(data.pageIds);
        expect(storageInfo.pageFolderIds).toEqual(data.pageFolderIds);
        expect(storageInfo.nextId).toEqual(data.nextId);
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('returns default StorageInfo if there is no object in storage',
      function(done) {
        spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

        StorageInfo.load().then((storageInfo) => {
          expect(storageInfo.version).toEqual(StorageInfo._VERSION);
          expect(storageInfo.pageIds).toEqual([]);
          expect(storageInfo.pageFolderIds).toEqual([]);
          expect(storageInfo.nextId).toEqual('1');
          done();
        })
          .catch((error) => done.fail(error));
      });

    it('returns default StorageInfo if there is an empty object in storage',
      function(done) {
        spyOn(Storage, 'load').and.returnValues(Promise.resolve({}));

        StorageInfo.load().then((storageInfo) => {
          expect(storageInfo.version).toEqual(StorageInfo._VERSION);
          expect(storageInfo.pageIds).toEqual([]);
          expect(storageInfo.pageFolderIds).toEqual([]);
          expect(storageInfo.nextId).toEqual('1');
          done();
        })
          .catch((error) => done.fail(error));
      });

    it('returns default StorageInfo if the storage load fails', function(done) {
      spyOn(Storage, 'load').and
        .returnValues(Promise.reject(new Error('ERROR_MESSAGE')));
      spyOn(storageInfoModule.__, 'log');

      StorageInfo.load().then((storageInfo) => {
        expect(storageInfo.version).toEqual(StorageInfo._VERSION);
        expect(storageInfo.pageIds).toEqual([]);
        expect(storageInfo.pageFolderIds).toEqual([]);
        expect(storageInfo.nextId).toEqual('1');
        expect(storageInfoModule.__.log.calls.argsFor(0))
          .toMatch('ERROR_MESSAGE');
        done();
      })
        .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a StorageInfo to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const data = {
        version: 42,
        pageIds: ['6', '5', '4'],
        pageFolderIds: ['0', '1'],
        nextId: '1',
      };
      const storageInfo = new StorageInfo(data);

      storageInfo.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(StorageInfo._KEY, data);
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and
        .returnValues(Promise.reject(new Error('AN_ERROR')));
      spyOn(storageInfoModule.__, 'log');

      new StorageInfo().save().then(() => {
        expect(storageInfoModule.__.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
        .catch((error) => done.fail(error));
    });
  });

  describe('createPage', function() {
    it('returns and increments nextId', function() {
      const storageInfo = new StorageInfo({nextId: '9'});

      const id = storageInfo.createPage();

      expect(id).toEqual('9');
      expect(storageInfo.nextId).toEqual('10');
    });

    it('appends the ID to the pageIds array', function() {
      const storageInfo = new StorageInfo({nextId: '1'});

      storageInfo.createPage();

      expect(storageInfo.pageIds).toContain('1');
    });
  });

  describe('createPageFolder', function() {
    it('returns and increments nextId', function() {
      const storageInfo = new StorageInfo({nextId: '9'});

      const id = storageInfo.createPageFolder();

      expect(id).toEqual('9');
      expect(storageInfo.nextId).toEqual('10');
    });

    it('appends the ID to the pageFolderIds array', function() {
      const storageInfo = new StorageInfo({nextId: '1'});

      storageInfo.createPageFolder();

      expect(storageInfo.pageFolderIds).toContain('1');
    });
  });

  describe('deleteItem', function() {
    it('deletes an existing Page', function() {
      const storageInfo = new StorageInfo({pageIds: ['1', '5', '3', '9']});

      storageInfo.deleteItem('3');

      expect(storageInfo.pageIds).toEqual(['1', '5', '9']);
    });

    it('deletes an existing PageFolder', function() {
      const storageInfo = new StorageInfo(
        {pageFolderIds: ['1', '5', '3', '9']});

      storageInfo.deleteItem('9');

      expect(storageInfo.pageFolderIds).toEqual(['1', '5', '3']);
    });

    it('does nothing if the requested Page doesn\'t exist', function() {
      const storageInfo = new StorageInfo({
        pageIds: ['1', '5', '3', '9'],
        pageFolderIds: ['4', '5'],
      });

      storageInfo.deleteItem('2');

      expect(storageInfo.pageIds).toEqual(['1', '5', '3', '9']);
      expect(storageInfo.pageFolderIds).toEqual(['4', '5']);
    });
  });

  describe('_addStorageListener', function() {
    it('updates the StorageInfo object when a StorageInfo update event fires',
      function() {
        const storageInfo = new StorageInfo({
          pageIds: ['1', '5', '3', '9'],
          pageFolderIds: ['4', '5'],
        });

        const newData = {
          pageIds: ['9', '8', '7'],
          pageFolderIds: ['0'],
        };

        this.storageListener({
          [StorageInfo._KEY]: {newValue: newData},
        });

        expect(storageInfo.pageIds).toEqual(newData.pageIds);
        expect(storageInfo.pageFolderIds).toEqual(newData.pageFolderIds);
      }
    );

    it('doesn\'t update the storageInfo object when a different event fires',
      function() {
        const storageInfo = new StorageInfo({
          pageIds: ['1', '5', '3', '9'],
          pageFolderIds: ['4', '5'],
        });

        const newData = {
          pageIds: ['9', '8', '7'],
          pageFolderIds: ['0'],
        };

        this.storageListener({
          ['invalidKey']: {newValue: newData},
        });

        expect(storageInfo.pageIds).toEqual(['1', '5', '3', '9']);
        expect(storageInfo.pageFolderIds).toEqual(['4', '5']);
      });
  });
});
