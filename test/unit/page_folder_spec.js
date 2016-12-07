/* global PageFolder */

describe('PageFolder', function() {
  describe('load', function() {
    it('loads a PageFolder from storage', function(done) {
      const id = '42';
      const data = {title: 'Folder Title',
                    children: ['1', '2', '3'],
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      PageFolder.load(id).then((pageFolder) => {
        expect(Storage.load).toHaveBeenCalledWith(PageFolder._KEY(id));
        expect(pageFolder.title).toEqual(data.title);
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
      spyOn(console, 'log');

      PageFolder.load('42').then((pageFolder) => {
        expect(pageFolder.title).toEqual('New Folder');
        expect(console.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
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
      spyOn(console, 'log');

      new PageFolder('37').save().then(() => {
        expect(console.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
