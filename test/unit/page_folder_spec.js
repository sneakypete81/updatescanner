import {PageFolder} from 'page/page_folder';
import {Storage} from 'util/storage';
import * as log from 'util/log';

describe('PageFolder', function() {
  describe('load', function() {
    it('loads a PageFolder from storage', function(done) {
      const id = '42';
      const data = {title: 'Folder Title',
                    state: PageFolder.stateEnum.CHANGED,
                    children: ['1', '2', '3'],
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      PageFolder.load(id).then((pageFolder) => {
        expect(Storage.load).toHaveBeenCalledWith(PageFolder._KEY(id));
        expect(pageFolder.title).toEqual(data.title);
        expect(pageFolder.state).toEqual(data.state);
        expect(pageFolder.children).toEqual(data.children);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default PageFolder if there is no object in storage',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      PageFolder.load('42').then((pageFolder) => {
        expect(pageFolder.title).toEqual('New Folder');
        expect(pageFolder.children).toEqual([]);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default PageFolder if the storage load fails',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MESSAGE'));
      spyOn(log, 'log');

      PageFolder.load('42').then((pageFolder) => {
        expect(pageFolder.title).toEqual('New Folder');
        expect(log.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a PageFolder to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const id = 33;
      const data = {title: 'A PageFolder',
                    state: PageFolder.stateEnum.CHANGED,
                    children: ['23', '34'],
                  };
      const pageFolder = new PageFolder(id, data);

      pageFolder.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(PageFolder._KEY(id), data);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(log, 'log');

      new PageFolder('37', {}).save().then(() => {
        expect(log.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('delete', function() {
    it('deletes a PageFolder from storage', function(done) {
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());

      const pageFolder = new PageFolder('33', {});

      pageFolder.delete().then(() => {
        expect(Storage.remove).toHaveBeenCalledWith(
          PageFolder._KEY(pageFolder.id));
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('silently logs an error if the delete operation fails', function(done) {
      spyOn(Storage, 'remove').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(log, 'log');

      const pageFolder = new PageFolder('37', {});

      pageFolder.delete().then(() => {
        expect(log.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('idFromKey', function() {
    it('extracts the id from a PageFolder key', function() {
      const key = PageFolder._KEY('987');
      const id = PageFolder.idFromKey(key);
      expect(id).toEqual('987');
    });

    it('returns null if the key is invalid', function() {
      const key = 'invalid:987';
      const id = PageFolder.idFromKey(key);
      expect(id).toBeNull();
    });
  });

  describe('isPageFolderKey', function() {
    it('returns true if key is for a PageFolder', function() {
      const key = PageFolder._KEY('123');
      const isPageFolderKey = PageFolder.isPageFolderKey(key);
      expect(isPageFolderKey).toBeTruthy();
    });

    it('returns false if key is not for a PageFolder', function() {
      const key = 'invalid:123';
      const isPageFolderKey = PageFolder.isPageFolderKey(key);
      expect(isPageFolderKey).toBeFalsy();
    });
  });
});
