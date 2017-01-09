/* global Storage */

describe('Storage', function() {
  beforeEach(function() {
    this._browser = window.browser;
    window.browser = {storage: {local: {get: {}, set: {}}}};
  });

  afterEach(function() {
    window.browser = this._browser;
  });

  describe('save', function() {
    it('saves an item to storage', function(done) {
      const key = 'thisIsAKey';
      const data = {thisIs: 'someData'};
      spyOn(browser.storage.local, 'set').and.returnValues(Promise.resolve());

      Storage.save(key, data).then(() => {
        expect(browser.storage.local.set).toHaveBeenCalledWith({[key]: data});
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('rejects the promise if the save operation fails', function(done) {
      spyOn(browser.storage.local, 'set').and.returnValues(
        Promise.reject('ERROR_MESSAGE'));

      Storage.save('test', 'data').then((result) => {
        done.fail('Promise was not rejected.');
      })
      .catch((error) => {
        expect(error).toEqual('ERROR_MESSAGE');
        done();
      });
    });
  });

  describe('load', function() {
    it('loads an item from storage', function(done) {
      const key = 'thisIsAKey';
      const data = {thisIs: 'someData'};
      spyOn(browser.storage.local, 'get').and.returnValues(
        Promise.resolve({[key]: data}));

      Storage.load(key).then((result) => {
        expect(result).toEqual(data);
        expect(browser.storage.local.get).toHaveBeenCalledWith(key);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns undefined if the key doesn\'t exist', function(done) {
      spyOn(browser.storage.local, 'get').and.returnValues(Promise.resolve({}));

      Storage.load('test').then((result) => {
        expect(result).toBeUndefined();
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('rejects the promise if the load operation fails', function(done) {
      spyOn(browser.storage.local, 'get').and.returnValues(
        Promise.reject('ERROR_MESSAGE'));

      Storage.load('test').then((result) => {
        done.fail('Promise was not rejected.');
      })
      .catch((error) => {
        expect(error).toEqual('ERROR_MESSAGE');
        done();
      });
    });
  });
});
