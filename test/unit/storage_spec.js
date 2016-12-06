/* global Storage */

describe('Storage', function() {
  beforeEach(function() {
    // sinon-chrome-webextensions currently exports 'chrome' for some reason
    /* global browser:true */
    browser = chrome;
    browser.flush();
  });

  afterEach(function() {
    /* eslint no-delete-var: 'off' */
    delete browser;
  });

  describe('save', function() {
    it('saves an item to storage', function(done) {
      const key = 'thisIsAKey';
      const data = {thisIs: 'someData'};
      browser.storage.local.set.returns(Promise.resolve());

      Storage.save(key, data).then(() => {
        // Using the Sinon spy from chrome-sinon
        expect(browser.storage.local.set.getCall(0).args)
          .toEqual([{[key]: data}]);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('rejects the promise if the save operation fails', function(done) {
      browser.storage.local.set.returns(Promise.reject('ERROR_MESSAGE'));

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
      browser.storage.local.get.withArgs(key).returns(
        Promise.resolve({[key]: data}));

      Storage.load(key).then((result) => {
        expect(result).toEqual(data);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns undefined if the key doesn\'t exist', function(done) {
      browser.storage.local.get.returns(Promise.resolve({}));

      Storage.load('test').then((result) => {
        expect(result).toBeUndefined();
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('rejects the promise if the load operation fails', function(done) {
      browser.storage.local.get.returns(Promise.reject('ERROR_MESSAGE'));

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
