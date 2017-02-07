import * as scan from 'scan/scan';
import * as fuzzy from 'scan/fuzzy';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';

describe('scan', function() {
  describe('getChangeType', function() {
    it('detects identical pages', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scan.__.getChangeType(html, html, 100);

      expect(result).toEqual(scan.__.changeEnum.NO_CHANGE);
    });

    it('detects new content', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scan.__.getChangeType('', html, 100);

      expect(result).toEqual(scan.__.changeEnum.NEW_CONTENT);
    });

    it('detects minor changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(fuzzy, 'isMajorChange').and.returnValues(false);

      const result = scan.__.getChangeType(html1, html2, 100);

      expect(result).toEqual(scan.__.changeEnum.MINOR_CHANGE);
    });

    it('detects major changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(fuzzy, 'isMajorChange').and.returnValues(true);

      const result = scan.__.getChangeType(html1, html2, 100);

      expect(result).toEqual(scan.__.changeEnum.MAJOR_CHANGE);
    });
  });

  describe('updatePageState', function() {
    beforeEach(function() {
      this.oldScanTime = new Date(1978, 11, 1, 4, 30).getTime();
      this.newScanTime = new Date(1978, 11, 5, 7, 15).getTime();
      this.page = new Page('1', {
        changeThreshold: 100,
        oldScanTime: this.oldScanTime,
        newScanTime: this.newScanTime,
      });

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1978, 11, 6, 19, 9));
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('does nothing if the page is unchanged', function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      scan.__.updatePageState(this.page, html, html);

      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).not.toHaveBeenCalled();
    });

    it('does nothing if the page is unchanged when previously changed',
       function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      scan.__.updatePageState(this.page, html, html);

      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).not.toHaveBeenCalled();
    });

    it('saves new content', function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      scan.__.updatePageState(this.page, '', html);

      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves a minor change without updating state', function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(false);

      scan.__.updatePageState(this.page, html1, html2);

      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('doesn\'t update state for a minor change when previously changed',
       function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(false);

      scan.__.updatePageState(this.page, html1, html2);

      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('updates old and new HTML for a new major change', function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(true);

      scan.__.updatePageState(this.page, html1, html2);

      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.newScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.OLD, html1);
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(2);
    });

    it('updates just the new HTML for a repeated major change', function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(true);

      scan.__.updatePageState(this.page, html1, html2);

      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', function() {
    it('does nothing when given an empty page list', function(done) {
      spyOn(window, 'fetch');
      spyOn(PageStore, 'loadHtml');

      scan.scan([]).then(() => {
        expect(window.fetch).not.toHaveBeenCalled();
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        done();
      }).catch((error) => done.fail(error));
    });

    it('Scans a single page', function(done) {
      const page = new Page('1', {url: 'http://www.example.com/'});
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValues(Promise.resolve(html));

      scan.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW);
        expect(page.error).toEqual(false);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Scans multiple pages', function(done) {
      const pages = [new Page('1', {url: 'http://www.example.com/'}),
                     new Page('2', {url: 'http://www.example2.com/'}),
                     new Page('3', {url: 'http://www.example3.com/'})];
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValue(Promise.resolve(html));

      scan.scan(pages).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(pages[0].url);
        expect(window.fetch).toHaveBeenCalledWith(pages[1].url);
        expect(window.fetch).toHaveBeenCalledWith(pages[2].url);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '2', PageStore.htmlTypes.NEW);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '3', PageStore.htmlTypes.NEW);
        expect(pages[0].error).toEqual(false);
        expect(pages[1].error).toEqual(false);
        expect(pages[2].error).toEqual(false);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Logs and saves HTTP error status codes', function(done) {
      const page = new Page('1', {title: 'example',
                                  url: 'http://www.example.com/'});

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: false, status: 404, statusText: 'no such page'}));
      spyOn(PageStore, 'loadHtml');
      spyOn(console, 'log').and.callFake((msg) => {
        expect(msg).toMatch('no such page');
        console.matched = true;
      });
      console.matched = false;

      scan.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.error).toEqual(true);
        expect(page.errorMessage).toEqual('[404] no such page');
        expect(console.matched).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Logs and saves network errors', function(done) {
      const page = new Page('1', {title: 'example',
                                  url: 'http://www.example.com/'});

      spyOn(window, 'fetch').and.returnValues(
        Promise.reject('Network error'));
      spyOn(PageStore, 'loadHtml');
      spyOn(console, 'log').and.callFake((msg) => {
        expect(msg).toMatch('Network error');
        console.matched = true;
      });
      console.matched = false;

      scan.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.error).toEqual(true);
        expect(page.errorMessage).toEqual('Network error');
        expect(console.matched).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });
  });
});
