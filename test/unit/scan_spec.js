import * as scanModule from '/lib/scan/scan.js';
import {PageStore} from '/lib/page/page_store.js';
import {status} from '/lib/redux/ducks/pages.js';

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
      this.id = '1';
      this.page = {
        changeThreshold: 100,
        oldScanTime: this.oldScanTime,
        newScanTime: this.newScanTime,
      };

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1978, 11, 6, 19, 9));
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('saves content if the page is unchanged', async function() {
      this.page.status = status.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';

      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[this.id]: this.page}}
      );
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(PageStore, 'saveHtml');

      const result = await scanModule.__.updatePageState(this.id, html, html);

      expect(result).toBeFalsy();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id: this.id,
        page: {
          status: status.NO_CHANGE,
          newScanTime: Date.now(),
        },
      });
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves content if the page is unchanged when previously changed',
      async function() {
        this.page.status = status.CHANGED;
        const html = 'Here is some <b>HTML</b>';

        spyOn(scanModule.__.store, 'getState').and.returnValue(
          {pages: {[this.id]: this.page}});
        spyOn(scanModule.__.store, 'dispatch');
        spyOn(PageStore, 'saveHtml');

        const result = await scanModule.__
          .updatePageState(this.id, html, html);

        expect(result).toBeFalsy();
        expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
          type: 'pages/EDIT_PAGE',
          id: this.id,
          page: {
            newScanTime: Date.now(),
          },
        });

        expect(PageStore.saveHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW, html);
        expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
      });

    it('saves new content', async function() {
      this.page.status = status.NO_CHANGE;
      const html = 'Here is some <b>HTML</b>';

      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[this.id]: this.page}}
      );
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(PageStore, 'saveHtml');

      const result = await scanModule.__.updatePageState(this.id, '', html);

      expect(result).toBeFalsy();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id: this.id,
        page: {
          status: status.NO_CHANGE,
          newScanTime: Date.now(),
        },
      });
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('saves a minor change without updating state', async function() {
      this.page.status = status.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';

      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[this.id]: this.page}}
      );
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(PageStore, 'saveHtml');
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(false);

      const result = await scanModule.__.updatePageState(this.id, html1, html2);

      expect(result).toBeFalsy();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id: this.id,
        page: {
          status: status.NO_CHANGE,
          newScanTime: Date.now(),
        },
      });
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
    });

    it('doesn\'t update state for a minor change when previously changed',
      async function() {
        this.page.status = status.CHANGED;
        const html1 = 'Here is some <b>HTML</b>';
        const html2 = 'Here is some different <b>HTML</b>';

        spyOn(scanModule.__.store, 'getState').and.returnValue(
          {pages: {[this.id]: this.page}});
        spyOn(scanModule.__.store, 'dispatch');
        spyOn(PageStore, 'saveHtml');
        spyOn(scanModule.__, 'isMajorChange').and.returnValues(false);

        const result = await scanModule.__.updatePageState(
          this.id, html1, html2);

        expect(result).toBeFalsy();
        expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
          type: 'pages/EDIT_PAGE',
          id: this.id,
          page: {
            newScanTime: Date.now(),
          },
        });
        expect(PageStore.saveHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW, html2);
        expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
      });

    it('updates old and new HTML for a new major change', async function() {
      this.page.status = status.NO_CHANGE;
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';

      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[this.id]: this.page}}
      );
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(PageStore, 'saveHtml');
      spyOn(scanModule.__, 'isMajorChange').and.returnValues(true);

      const result = await scanModule.__.updatePageState(
        this.id, html1, html2);

      expect(result).toBeTruthy();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id: this.id,
        page: {
          status: status.CHANGED,
          oldScanTime: this.page.newScanTime,
          newScanTime: Date.now(),
        },
      });
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.OLD, html1);
      expect(PageStore.saveHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW, html2);
      expect(PageStore.saveHtml).toHaveBeenCalledTimes(2);
    });

    it('updates just the new HTML for a repeated major change',
      async function() {
        this.page.status = status.CHANGED;
        const html1 = 'Here is some <b>HTML</b>';
        const html2 = 'Here is some different <b>HTML</b>';

        spyOn(scanModule.__.store, 'getState').and.returnValue(
          {pages: {[this.id]: this.page}});
        spyOn(scanModule.__.store, 'dispatch');
        spyOn(PageStore, 'saveHtml');
        spyOn(scanModule.__, 'isMajorChange').and.returnValues(true);

        const result = await scanModule.__.updatePageState(
          this.id, html1, html2);

        expect(result).toBeTruthy();
        expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
          type: 'pages/EDIT_PAGE',
          id: this.id,
          page: {
            status: status.CHANGED,
            newScanTime: Date.now(),
          },
        });
        expect(PageStore.saveHtml).toHaveBeenCalledWith(
          '1', PageStore.htmlTypes.NEW, html2);
        expect(PageStore.saveHtml).toHaveBeenCalledTimes(1);
      });
  });

  describe('scan', function() {
    beforeEach(function() {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1978, 11, 6, 19, 9));
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('does nothing when given an empty page list', async function() {
      spyOn(window, 'fetch');
      spyOn(PageStore, 'loadHtml');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      await scanModule.scan([]);

      expect(window.fetch).not.toHaveBeenCalled();
      expect(PageStore.loadHtml).not.toHaveBeenCalled();
    });

    it('does nothing if the data structures are not up to date',
      async function() {
        const id = '1';

        spyOn(window, 'fetch');
        spyOn(PageStore, 'loadHtml');
        spyOn(scanModule.__, 'waitForMs');
        spyOn(scanModule.__, 'isUpToDate')
          .and.returnValue(Promise.resolve(false));

        await scanModule.scan([id]);

        expect(window.fetch).not.toHaveBeenCalled();
        expect(PageStore.loadHtml).not.toHaveBeenCalled();
      });

    it('Scans a single page', async function() {
      const id = '1';
      const page = {url: 'http://www.example.com/', encoding: 'utf-8'};
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValues(Promise.resolve(html));
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'isAutoscanPending').and.returnValue(false);

      await scanModule.scan([id]);

      expect(window.fetch).toHaveBeenCalledWith(page.url);
      expect(PageStore.loadHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW);
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id,
        page: {
          status: status.NO_CHANGE,
          newScanTime: Date.now(),
        },
      });
    });

    it('Scans multiple pages', async function() {
      const pages = {
        '1': {url: 'http://www.example.com/', encoding: 'utf-8'},
        '2': {url: 'http://www.example2.com/', encoding: 'utf-8'},
        '3': {url: 'http://www.example3.com/', encoding: 'utf-8'},
      };
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValue(Promise.resolve(html));
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(scanModule.__.store, 'getState').and.returnValue({pages});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'isAutoscanPending').and.returnValue(false);

      await scanModule.scan(Object.keys(pages));

      expect(window.fetch).toHaveBeenCalledWith(pages['1'].url);
      expect(window.fetch).toHaveBeenCalledWith(pages['2'].url);
      expect(window.fetch).toHaveBeenCalledWith(pages['3'].url);
      expect(PageStore.loadHtml).toHaveBeenCalledWith(
        '1', PageStore.htmlTypes.NEW);
      expect(PageStore.loadHtml).toHaveBeenCalledWith(
        '2', PageStore.htmlTypes.NEW);
      expect(PageStore.loadHtml).toHaveBeenCalledWith(
        '3', PageStore.htmlTypes.NEW);
      for (const id of Object.keys(pages)) {
        expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
          type: 'pages/EDIT_PAGE',
          id,
          page: {
            status: status.NO_CHANGE,
            newScanTime: Date.now(),
          },
        });
      }
    });

    it('Logs and saves HTTP error status codes', async function() {
      const id = '1';
      const page = {title: 'example', url: 'http://www.example.com/', encoding: 'utf-8'};

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: false, status: 404, statusText: 'no such page'}));
      spyOn(PageStore, 'loadHtml');
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      await scanModule.scan([id]);

      expect(window.fetch).toHaveBeenCalledWith(page.url);
      expect(PageStore.loadHtml).not.toHaveBeenCalled();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id,
        page: {
          status: status.ERROR,
        },
      });
      expect(scanModule.__.log.calls.allArgs()).toContain(
        ['Could not scan "example": Error: [404] no such page']);
    });

    it('Logs and saves network errors', async function() {
      const id = '1';
      const page = {title: 'example', url: 'http://www.example.com/', encoding: 'utf-8'};

      spyOn(window, 'fetch').and
        .returnValues(Promise.reject(new Error('Network error')));
      spyOn(PageStore, 'loadHtml');
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));

      await scanModule.scan(['1']);

      expect(window.fetch).toHaveBeenCalledWith(page.url);
      expect(PageStore.loadHtml).not.toHaveBeenCalled();
      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id,
        page: {
          status: status.ERROR,
        },
      });
      expect(scanModule.__.log.calls.allArgs()).toContain(
        ['Could not scan "example": Error: Network error']);
    });

    it('updates lastAutoscanTime if autoscan is due', async function() {
      const id = '1';
      const page = {url: 'http://www.example.com/', encoding: 'utf-8'};
      const html = 'Some <b>HTML</b>';

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: true, text: () => html}));
      spyOn(PageStore, 'loadHtml').and.returnValues(Promise.resolve(html));
      spyOn(PageStore, 'saveHtml').and.returnValue(Promise.resolve(html));
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'isAutoscanPending').and.returnValue(true);

      await scanModule.scan([id]);

      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id,
        page: {
          status: status.NO_CHANGE,
          newScanTime: Date.now(),
          lastAutoscanTime: Date.now(),
        },
      });
    });

    it('updates lastAutoscanTime if a scan error occurs', async function() {
      const id = '1';
      const page = {title: 'example', url: 'http://www.example.com/', encoding: 'utf-8'};

      spyOn(window, 'fetch').and.returnValues(
        Promise.resolve({ok: false, status: 404, statusText: 'no such page'}));
      spyOn(PageStore, 'loadHtml');
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');
      spyOn(scanModule.__, 'log');
      spyOn(scanModule.__, 'waitForMs');
      spyOn(scanModule.__, 'isUpToDate').and.returnValue(Promise.resolve(true));
      spyOn(scanModule.__, 'isAutoscanPending').and.returnValue(true);

      await scanModule.scan([id]);

      expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
        type: 'pages/EDIT_PAGE',
        id,
        page: {
          status: status.ERROR,
          lastAutoscanTime: Date.now(),
        },
      });
      expect(scanModule.__.log.calls.allArgs()).toContain(
        ['Could not scan "example": Error: [404] no such page']);
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
      const id = '1';
      const page = {encoding: 'encoding'};
      const response = {arrayBuffer: () => Promise.resolve('buffer')};

      spyOn(scanModule.__, 'applyEncoding').and.returnValue('html');
      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});
      spyOn(scanModule.__.store, 'dispatch');

      const html = await scanModule.__.getHtmlFromResponse(response, id);

      expect(html).toEqual('html');
      expect(scanModule.__.applyEncoding)
        .toHaveBeenCalledWith('buffer', 'encoding');
    });

    it('autodetects the encoding if not specified in the Page object',
      async function() {
        const id = '1';
        const page = {encoding: null};
        const response = {
          arrayBuffer: () => Promise.resolve('buffer'),
          headers: 'headers',
        };
        spyOn(scanModule.__, 'detectEncoding').and.returnValue('encoding');
        spyOn(scanModule.__, 'applyEncoding').and.returnValue('html');
        spyOn(scanModule.__.store, 'getState').and.returnValue(
          {pages: {[id]: page}});
        spyOn(scanModule.__.store, 'dispatch');

        const html = await scanModule.__.getHtmlFromResponse(response, id);

        expect(html).toEqual('html');
        expect(scanModule.__.applyEncoding)
          .toHaveBeenCalledWith('buffer', 'utf-8');
        expect(scanModule.__.detectEncoding)
          .toHaveBeenCalledWith('headers', 'html');
        expect(scanModule.__.applyEncoding)
          .toHaveBeenCalledWith('buffer', 'encoding');
        expect(scanModule.__.store.dispatch).toHaveBeenCalledWith({
          type: 'pages/EDIT_PAGE',
          id,
          page: {
            encoding: 'encoding',
          },
        });
      });

    it('uses response.text() for utf-8 encodings', async function() {
      const id = '1';
      const page = {encoding: 'utf-8'};
      const response = {text: () => Promise.resolve('html')};

      spyOn(scanModule.__.store, 'getState').and.returnValue(
        {pages: {[id]: page}});

      const html = await scanModule.__.getHtmlFromResponse(response, id);

      expect(html).toEqual('html');
    });
  });
});
