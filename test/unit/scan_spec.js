import * as scan from 'scan/scan';
import * as fuzzy from 'scan/fuzzy';
import {PageStore} from 'page/page_store';
import {Page} from 'page/page';
import * as log from 'util/log';

describe('scan', function() {
  describe('getChangeType', function() {
    it('detects identical pages', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scan.__.getChangeType(html, html, 100);

      expect(result).toEqual(scan.__.changeEnum.NO_CHANGE);
    });

    it('detects new content', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scan.__.getChangeType(null, html, 100);

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

    it('saves content if the page is unchanged', async function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      const result = await scan.__.updatePageState(this.page, html, html);

      expect(result).toBeFalsy();
      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves content if the page is unchanged when previously changed',
       async function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      const result = await scan.__.updatePageState(this.page, html, html);

      expect(result).toBeFalsy();
      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves new content', async function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');

      const result = await scan.__.updatePageState(this.page, '', html);

      expect(result).toBeFalsy();
      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves a minor change without updating state', async function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(false);

      const result = await scan.__.updatePageState(this.page, html1, html2);

      expect(result).toBeFalsy();
      expect(this.page.state).toEqual(Page.stateEnum.NO_CHANGE);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('doesn\'t update state for a minor change when previously changed',
       async function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(false);

      const result = await scan.__.updatePageState(this.page, html1, html2);

      expect(result).toBeFalsy();
      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('updates old and new HTML for a new major change', async function() {
      this.page.state = Page.stateEnum.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(true);

      const result = await scan.__.updatePageState(this.page, html1, html2);

      expect(result).toBeTruthy();
      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.newScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.OLD, html1);
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(2);
    });

    it('updates just the new HTML for a repeated major change',
    async function() {
      this.page.state = Page.stateEnum.CHANGED;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(this.page, 'save');
      spyOn(PageStore, 'saveHtml');
      spyOn(fuzzy, 'isMajorChange').and.returnValues(true);

      const result = await scan.__.updatePageState(this.page, html1, html2);

      expect(result).toBeTruthy();
      expect(this.page.state).toEqual(Page.stateEnum.CHANGED);
      expect(this.page.oldScanTime).toEqual(this.oldScanTime);
      expect(this.page.newScanTime).toEqual(Date.now());
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('scan', function() {
    it('does nothing when given an empty page list', function(done) {
      spyOn(window, 'fetch');
      spyOn(PageStore, 'loadHtml');
      spyOn(log, 'log');

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
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(Page.prototype, 'save');
      spyOn(log, 'log');

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
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(Page.prototype, 'save');
      spyOn(log, 'log');

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
      spyOn(log, 'log');

      scan.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.error).toEqual(true);
        expect(page.errorMessage).toEqual('Error: [404] no such page');
        expect(log.log.calls.allArgs()).toContain(
          ['Could not scan "example": Error: [404] no such page']);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Logs and saves network errors', function(done) {
      const page = new Page('1', {title: 'example',
                                  url: 'http://www.example.com/'});

      spyOn(window, 'fetch').and.returnValues(
        Promise.reject('Network error'));
      spyOn(PageStore, 'loadHtml');
      spyOn(log, 'log');

      scan.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.error).toEqual(true);
        expect(page.errorMessage).toEqual('Network error');
        expect(log.log.calls.allArgs()).toContain(
          ['Could not scan "example": Network error']);
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('stripHtml', function() {
    it('strips whitespace', function() {
      const prevHtml = 'text with\tspaces\ntabs  \n \r  and newlines';
      const scannedHtml = 'More text with\tspaces\ntabs  \n \r  and newlines';

      const result = scan.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithspacestabsandnewlines');
      expect(result.scannedHtml).toEqual('Moretextwithspacestabsandnewlines');
    });

    it('strips scripts', function() {
      const prevHtml = 'text with<script blah>inline </script> script ' +
        '<script> tags</script>s';
      const scannedHtml = 'text with <script>\nnewlines</script> of various' +
        '<script>\r\n   types\r\n</script>..';

      const result = scan.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithscripts');
      expect(result.scannedHtml).toEqual('textwithofvarious..');
    });

    it('strips tags', function() {
      const prevHtml = 'text with <b>tags</b> included.';
      const scannedHtml = '<p>More text with<br/>tags</p>';

      const result = scan.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithtagsincluded.');
      expect(result.scannedHtml).toEqual('Moretextwithtags');
    });

    it('strips numbers if Page.ignoreNumbers is true', function() {
      const prevHtml = 'text with 12.3 numbers, full stops and commas.';
      const scannedHtml = 'More text with 12.3 numbers, etc.';

      const result = scan.__.stripHtml(prevHtml, scannedHtml, true);

      expect(result.prevHtml).toEqual('textwithnumbersfullstopsandcommas');
      expect(result.scannedHtml).toEqual('Moretextwithnumbersetc');
    });

    it('doesn\'t strip numbers if Page.ignoreNumbers is false', function() {
      const prevHtml = 'text with 12.3 numbers, stops and commas.';
      const scannedHtml = 'More text with 12.3 numbers, etc.';

      const result = scan.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwith12.3numbers,stopsandcommas.');
      expect(result.scannedHtml).toEqual('Moretextwith12.3numbers,etc.');
    });

    it('handles null HTML input', function() {
      const result = scan.__.stripHtml(null, null, true);

      expect(result.prevHtml).toBe(null);
      expect(result.scannedHtml).toBe(null);
    });
  });
});
