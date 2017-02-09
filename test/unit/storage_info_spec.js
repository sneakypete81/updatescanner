import {StorageInfo} from 'page/storage_info';
import {Storage} from 'util/storage';
import * as log from 'util/log';

describe('StorageInfo', function() {
  describe('load', function() {
    it('loads StorageInfo from storage', function(done) {
      const data = {version: 99,
                    pageIds: ['1', '2', '3'],
                    pageFolderIds: ['0', '4'],
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      StorageInfo.load().then((storageInfo) => {
        expect(Storage.load).toHaveBeenCalledWith(StorageInfo._KEY);
        expect(storageInfo.version).toEqual(data.version);
        expect(storageInfo.pageIds).toEqual(data.pageIds);
        expect(storageInfo.pageFolderIds).toEqual(data.pageFolderIds);
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
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns default StorageInfo if the storage load fails', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MESSAGE'));
      spyOn(log, 'log');

      StorageInfo.load().then((storageInfo) => {
        expect(storageInfo.version).toEqual(StorageInfo._VERSION);
        expect(storageInfo.pageIds).toEqual([]);
        expect(storageInfo.pageFolderIds).toEqual([]);
        expect(log.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a StorageInfo to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const data = {version: 42,
                    pageIds: ['6', '5', '4'],
                    pageFolderIds: ['0', '1'],
                  };
      const storageInfo = new StorageInfo(data);

      storageInfo.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(StorageInfo._KEY, data);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(log, 'log');

      new StorageInfo().save().then(() => {
        expect(log.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
