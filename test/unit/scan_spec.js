import * as scanModule from '/lib/scan/scan.js';
import {PageStore} from '/lib/page/page_store.js';
import {Page} from '/lib/page/page.js';

describe('scan', function() {
  describe('getChangeType', function() {
    it('detects identical pages', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scanModule.__.getChangeType(html, html, 100);

      expect(result).toEqual(scanModule.__.changeEnum.NO_CHANGE);
    });

    it('detects new content', function() {
      const html = 'Here is some <b>HTML</b>';

      const result = scanModule.__.getChangeType(null, html, 100);

      expect(result).toEqual(scanModule.__.changeEnum.NEW_CONTENT);
    });

    it('detects minor changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(false);

      const result = scanModule.__.getChangeType(html1, html2, 100);

      expect(result).toEqual(scanModule.__.changeEnum.MINOR_CHANGE);
    });

    it('detects major changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(true);

      const result = scanModule.__.getChangeType(html1, html2, 100);

      expect(result).toEqual(scanModule.__.changeEnum.MAJOR_CHANGE);
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

      const result = await scanModule.__.updatePageState(this.page, html, html);

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

        const result = await scanModule.__
          .updatePageState(this.page, html, html);

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

      const result = await scanModule.__.updatePageState(this.page, '', html);

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
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(false);

      const result = await scanModule.__.updatePageState(
        this.page, html1, html2);

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
        spyOn(scanModule.__, 'isMajorChange').and.returnValues(false);

        const result = await scanModule.__.updatePageState(
          this.page, html1, html2);

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
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(true);

      const result = await scanModule.__.updatePageState(
        this.page, html1, html2);

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
        spyOn(scanModule.__, 'isMajorChange').and.returnValues(true);

        const result = await scanModule.__.updatePageState(
          this.page, html1, html2);

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
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      scanModule.scan([]).then(() => {
        expect(window.fetch).not.toHaveBeenCalled();
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        done();
      }).catch((error) => done.fail(error));
    });

    it('does nothing if the data structures are not up to date',
      function(done) {
        const page = new Page('1', {
          url: 'http://www.example.com/', encoding: 'utf-8',
        });

        spyOn(window, 'fetch');
        spyOn(PageStore, 'loadHtml');
        spyOn(scanModule.__, 'waitForMs');
        spyOn(scanModule.__, 'isUpToDate')
          .and.returnValue(Promise.resolve(false));

        scanModule.scan([page]).then(() => {
          expect(window.fetch).not.toHaveBeenCalled();
          expect(PageStore.loadHtml).not.toHaveBeenCalled();
          done();
        }).catch((error) => done.fail(error));
      });

    it('Scans a single page', function(done) {
      const page = new Page('1', {
        url: 'http://www.example.com/', encoding: 'utf-8',
      });
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValues(Promise.resolve(html));
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(Page.prototype, 'save');
      spyOn(Page.prototype, 'existsInStorage')
        .and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      scanModule.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW);
        expect(page.state).toEqual(Page.stateEnum.NO_CHANGE);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Scans multiple pages', function(done) {
      const pages = [
        new Page('1', {url: 'http://www.example.com/', encoding: 'utf-8'}),
        new Page('2', {url: 'http://www.example2.com/', encoding: 'utf-8'}),
        new Page('3', {url: 'http://www.example3.com/', encoding: 'utf-8'}),
      ];
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValue(Promise.resolve(html));
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(Page.prototype, 'save');
      spyOn(Page.prototype, 'existsInStorage')
        .and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      scanModule.scan(pages).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(pages[0].url);
        expect(window.fetch).toHaveBeenCalledWith(pages[1].url);
        expect(window.fetch).toHaveBeenCalledWith(pages[2].url);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '2', PageStore.htmlTypes.NEW);
        expect(PageStore.loadHtml).toHaveBeenCalledWith(
          '3', PageStore.htmlTypes.NEW);
        expect(pages[0].state).toEqual(Page.stateEnum.NO_CHANGE);
        expect(pages[1].state).toEqual(Page.stateEnum.NO_CHANGE);
        expect(pages[2].state).toEqual(Page.stateEnum.NO_CHANGE);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Logs and saves HTTP error status codes', function(done) {
      const page = new Page('1', {
        title: 'example', url: 'http://www.example.com/', encoding: 'utf-8',
      });

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: false, status: 404, statusText: 'no such page'}));
      spyOn(PageStore, 'loadHtml');
      spyOn(Page.prototype, 'existsInStorage')
        .and.returnValue(Promise.resolve(true));
      spyOn(page, 'save');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      scanModule.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.state).toEqual(Page.stateEnum.ERROR);
        expect(page.save).toHaveBeenCalled();
        expect(scanModule.__.log.calls.allArgs()).toContain(
          ['Could not scan "example": Error: [404] no such page']);
        done();
      }).catch((error) => done.fail(error));
    });

    it('Logs and saves network errors', function(done) {
      const page = new Page('1', {
        title: 'example', url: 'http://www.example.com/', encoding: 'utf-8',
      });

      spyOn(window, 'fetch').and
        .returnValues(Promise.reject(new Error('Network error')));
      spyOn(PageStore, 'loadHtml');
      spyOn(Page.prototype, 'existsInStorage').and
        .returnValue(Promise.resolve(true));
      spyOn(page, 'save');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      scanModule.scan([page]).then(() => {
        expect(window.fetch).toHaveBeenCalledWith(page.url);
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
        expect(page.state).toEqual(Page.stateEnum.ERROR);
        expect(page.save).toHaveBeenCalled();
        expect(scanModule.__.log.calls.allArgs()).toContain(
          ['Could not scan "example": Error: Network error']);
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('stripHtml', function() {
    it('strips whitespace', function() {
      const prevHtml = 'text with\tspaces\ntabs  \n \r  and newlines';
      const scannedHtml = 'More text with\tspaces\ntabs  \n \r  and newlines';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithspacestabsandnewlines');
      expect(result.scannedHtml).toEqual('Moretextwithspacestabsandnewlines');
    });

    it('strips scripts', function() {
      const prevHtml = 'text with<script blah>inline </script> script ' +
        '<script> tags</script>s';
      const scannedHtml = 'text with <script>\nnewlines</script> of various' +
        '<script>\r\n   types\r\n</script>..';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithscripts');
      expect(result.scannedHtml).toEqual('textwithofvarious..');
    });

    it('strips tags', function() {
      const prevHtml = 'text with <b>tags</b> included.';
      const scannedHtml = '<p>More text with<br/>tags</p>';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwithtagsincluded.');
      expect(result.scannedHtml).toEqual('Moretextwithtags');
    });

    it('strips numbers if Page.ignoreNumbers is true', function() {
      const prevHtml = 'text with 12.3 numbers, full stops and commas.';
      const scannedHtml = 'More text with 12.3 numbers, etc.';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, true);

      expect(result.prevHtml).toEqual('textwithnumbersfullstopsandcommas');
      expect(result.scannedHtml).toEqual('Moretextwithnumbersetc');
    });

    it('doesn\'t strip numbers if Page.ignoreNumbers is false', function() {
      const prevHtml = 'text with 12.3 numbers, stops and commas.';
      const scannedHtml = 'More text with 12.3 numbers, etc.';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, false);

      expect(result.prevHtml).toEqual('textwith12.3numbers,stopsandcommas.');
      expect(result.scannedHtml).toEqual('Moretextwith12.3numbers,etc.');
    });

    it('handles null HTML input', function() {
      const result = scanModule.__.stripHtml(null, null, true);

      expect(result.prevHtml).toBe(null);
      expect(result.scannedHtml).toBe(null);
    });
  });

  describe('getHtmlFromResponse', function() {
    it('applies the encoding in the Page object', async function() {
      const page = new Page(1, {encoding: 'encoding'});
      const response = {arrayBuffer: () => Promise.resolve('buffer')};
      spyOn(scanModule.__, 'applyEncoding').and.returnValue('html');

      const html = await scanModule.__.getHtmlFromResponse(response, page);

      expect(html).toEqual('html');
      expect(scanModule.__.applyEncoding)
        .toHaveBeenCalledWith('buffer', 'encoding');
    });

    it('autodetects the encoding if not specified in the Page object',
      async function() {
        const page = new Page(1, {});
        const response = {
          arrayBuffer: () => Promise.resolve('buffer'),
          headers: 'headers',
        };
        spyOn(scanModule.__, 'detectEncoding').and.returnValue('encoding');
        spyOn(scanModule.__, 'applyEncoding').and.returnValue('html');
        spyOn(page, 'save');

        const html = await scanModule.__.getHtmlFromResponse(response, page);

        expect(html).toEqual('html');
        expect(scanModule.__.applyEncoding)
          .toHaveBeenCalledWith('buffer', 'utf-8');
        expect(scanModule.__.detectEncoding)
          .toHaveBeenCalledWith('headers', 'html');
        expect(scanModule.__.applyEncoding)
          .toHaveBeenCalledWith('buffer', 'encoding');
        expect(page.save).toHaveBeenCalled;
        expect(page.encoding).toEqual('encoding');
      });

    it('uses response.text() for utf-8 encodings', async function() {
      const page = new Page(1, {encoding: 'utf-8'});
      const response = {text: () => Promise.resolve('html')};

      const html = await scanModule.__.getHtmlFromResponse(response, page);

      expect(html).toEqual('html');
    });
  });
});
