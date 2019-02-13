import {Page} from '/lib/page/page.js';
import * as pageModule from '/lib/page/page.js';
import {Storage} from '/lib/util/storage.js';

describe('Page', function() {
  describe('load', function() {
    it('loads a Page from storage', async function() {
      const id = '42';
      const data = {
        title: 'Page Title',
        url: 'https://example.com/test',
      };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      const page = await Page.load(id);
      expect(Storage.load).toHaveBeenCalledWith(Page._KEY(id));
      expect(page.id).toEqual(id);
      expect(page.title).toEqual(data.title);
      expect(page.url).toEqual(data.url);
    });

    it('returns the default Page if there is no object in storage',
      async function() {
        spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

        const page = await Page.load('42');
        expect(page.title).toEqual('New Page');
      });

    it('returns the default Page if the storage load fails', async function() {
      spyOn(Storage, 'load').and
        .returnValues(Promise.reject(new Error('ERROR_MESSAGE')));
      spyOn(pageModule.__, 'log');

      const page = await Page.load('42');
      expect(page.title).toEqual('New Page');
      expect(pageModule.__.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
    });

    it('ignores invalid Page attributes', async function() {
      const id = '42';
      const data = {
        title: 'Page Title',
        url: 'https://example.com/test',
        invalidAttribute: 'boo',
      };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      const page = await Page.load(id);
      expect(Storage.load).toHaveBeenCalledWith(Page._KEY(id));
      expect(page.id).toEqual(id);
      expect(page.title).toEqual(data.title);
      expect(page.url).toEqual(data.url);
      expect(page.invalidAttribute).toBe(undefined);
    });
  });

  describe('save', function() {
    it('saves a Page to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const id = '33';
      const data = {
        title: 'A Page',
        url: 'https://www.example.com/test',
        changeThreshold: 1234,
        scanRateMinutes: 64,
        ignoreNumbers: true,
        encoding: 'utf-8',
        highlightChanges: true,
        highlightColour: 'green',
        markChanges: false,
        doPost: true,
        postParams: 'foo=bar',
        state: Page.stateEnum.NO_CHANGE,
        lastAutoscanTime: 10209876,
        oldScanTime: 9381234,
        newScanTime: 40834321,
      };
      const page = new Page(id, data);

      page.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(Page._KEY(id), data);
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and
        .returnValues(Promise.reject(new Error('AN_ERROR')));
      spyOn(pageModule.__, 'log');

      const page = new Page('37', {});

      page.save().then(() => {
        expect(pageModule.__.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
        .catch((error) => done.fail(error));
    });
  });

  describe('delete', function() {
    it('deletes a Page from storage', function(done) {
      spyOn(Storage, 'remove').and.returnValues(Promise.resolve());

      const page = new Page('33', {});

      page.delete().then(() => {
        expect(Storage.remove).toHaveBeenCalledWith(Page._KEY(page.id));
        done();
      })
        .catch((error) => done.fail(error));
    });

    it('silently logs an error if the delete operation fails', function(done) {
      spyOn(Storage, 'remove').and
        .returnValues(Promise.reject(new Error('AN_ERROR')));
      spyOn(pageModule.__, 'log');

      const page = new Page('37', {});

      page.delete().then(() => {
        expect(pageModule.__.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
        .catch((error) => done.fail(error));
    });
  });

  describe('idFromKey', function() {
    it('extracts the id from a Page key', function() {
      const key = Page._KEY('987');
      const id = Page.idFromKey(key);
      expect(id).toEqual('987');
    });

    it('returns null if the key is invalid', function() {
      const key = 'invalid:987';
      const id = Page.idFromKey(key);
      expect(id).toBeNull();
    });
  });

  describe('isPageKey', function() {
    it('returns true if key is for a Page', function() {
      const key = Page._KEY('123');
      const isPageKey = Page.isPageKey(key);
      expect(isPageKey).toBeTruthy();
    });

    it('returns false if key is not for a Page', function() {
      const key = 'invalid:123';
      const isPageKey = Page.isPageKey(key);
      expect(isPageKey).toBeFalsy();
    });
  });
});
