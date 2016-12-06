/* global Page */

describe('Page', function() {
  describe('load', function() {
    it('loads a Page from storage', function(done) {
      const id = '42';
      const data = {title: 'Page Title',
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      Page.load(id).then((page) => {
        expect(Storage.load).toHaveBeenCalledWith(Page._KEY(id));
        expect(page.title).toEqual(data.title);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default Page if there is no object in storage',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      Page.load('42').then((page) => {
        expect(page.title).toEqual('New Page');
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default Page if the storage load fails', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MESSAGE'));
      spyOn(console, 'log');

      Page.load('42').then((page) => {
        expect(page.title).toEqual('New Page');
        expect(console.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a Page to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const id = 33;
      const data = {title: 'A Page',
                  };
      const page = new Page(id, data);

      page.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(Page._KEY(id), data);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(console, 'log');

      new Page('37').save().then(() => {
        expect(console.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
