import * as scanModule from '/lib/scan/scan_content.js';
import {Page} from '/lib/page/page.js';

describe('scan_content', function() {
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

  describe('stripHtml', function() {
    it('strips whitespace', function() {
      const prevHtml = 'text with\tspaces\ntabs  \n \r  and newlines';
      const scannedHtml = 'More text with\tspaces\ntabs  \n \r  and newlines';

      const resultPrevHtml = scanModule.__.stripHtml(prevHtml, false, false);
      const resultScanHtml = scanModule.__.stripHtml(scannedHtml, false, false);

      expect(resultPrevHtml).toEqual('textwithspacestabsandnewlines');
      expect(resultScanHtml).toEqual('Moretextwithspacestabsandnewlines');
    });

    it('strips scripts', function() {
      const prevHtml = 'text with<script blah>inline </script> script ' +
        '<script> tags</script>s';
      const scannedHtml = 'text with <script>\nnewlines</script> of various' +
        '<script>\r\n   types\r\n</script>..';

      const result = scanModule.__.stripHtml(
        prevHtml,
        scannedHtml,
        true,
        false,
      );

      expect(result.prevHtml).toEqual('textwithscripts');
      expect(result.scannedHtml).toEqual('textwithofvarious..');
    });

    it('strips tags', function() {
      const prevHtml = 'text with <b>tags</b> included.';
      const scannedHtml = '<p>More text with<br/>tags</p>';

      const result = scanModule.__.stripHtml(
        prevHtml,
        scannedHtml,
        true,
        false,
      );

      expect(result.prevHtml).toEqual('textwithtagsincluded.');
      expect(result.scannedHtml).toEqual('Moretextwithtags');
    });

    it('strips numbers if Page.ignoreNumbers is true', function() {
      const prevHtml = 'text with 12.3 numbers, full stops and commas.';
      const scannedHtml = 'More text with 12.3 numbers, etc.';

      const result = scanModule.__.stripHtml(prevHtml, scannedHtml, true, true);

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

    it(
      'autodetects the encoding if not specified in the Page object',
      async function() {
        const page = new Page(1, {});
        const response = {
          arrayBuffer: () => Promise.resolve('buffer'),
          headers: 'headers',
        };
        spyOn(scanModule.__, 'detectEncoding').and.returnValue('encoding');
        spyOn(scanModule.__, 'applyEncoding').and.returnValue('html');
        spyOn(Page, 'load').and.returnValue(Promise.resolve(page));
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
      },
    );

    it('uses response.text() for utf-8 encodings', async function() {
      const page = new Page(1, {encoding: 'utf-8'});
      const response = {text: () => Promise.resolve('html')};

      const html = await scanModule.__.getHtmlFromResponse(response, page);

      expect(html).toEqual('html');
    });
  });
});
