/* global StorageInfo */

describe('StorageInfo', function() {
  describe('load', function() {
    it('loads StorageInfo from storage', function(done) {
      const data = {version: 99,
                    pageCount: 23,
                    folderCount: 5,
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      StorageInfo.load().then((storageInfo) => {
        expect(Storage.load).toHaveBeenCalledWith(StorageInfo._KEY);
        expect(storageInfo.version).toEqual(data.version);
        expect(storageInfo.pageCount).toEqual(data.pageCount);
        expect(storageInfo.folderCount).toEqual(data.folderCount);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns default StorageInfo if there is no object in storage',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      StorageInfo.load().then((storageInfo) => {
        expect(storageInfo.version).toEqual(StorageInfo._VERSION);
        expect(storageInfo.pageCount).toEqual(0);
        expect(storageInfo.folderCount).toEqual(0);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns default StorageInfo if there is an empty object in storage',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({}));

      StorageInfo.load().then((storageInfo) => {
        expect(storageInfo.version).toEqual(StorageInfo._VERSION);
        expect(storageInfo.pageCount).toEqual(0);
        expect(storageInfo.folderCount).toEqual(0);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns default StorageInfo if the storage load fails', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MESSAGE'));
      spyOn(console, 'log');

      StorageInfo.load().then((storageInfo) => {
        expect(storageInfo.version).toEqual(StorageInfo._VERSION);
        expect(storageInfo.pageCount).toEqual(0);
        expect(storageInfo.folderCount).toEqual(0);
        expect(console.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a StorageInfo to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const data = {version: 42,
                    pageCount: 63,
                    folderCount: 8,
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
      spyOn(console, 'log');

      new StorageInfo().save().then(() => {
        expect(console.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
