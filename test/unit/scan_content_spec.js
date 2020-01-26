import * as scanContentModule from '/lib/scan/scan_content.js';
import {Page} from '/lib/page/page.js';
import {ContentData} from '/lib/scan/scan_content.js';

describe('scan_content', function() {
  describe('getChanges', function() {
    it('detects identical pages', function() {
      const html = 'Here is some <b>HTML</b>';
      const page = new Page('test', {changeThreshold: 100});

      const result = scanContentModule.__.getChanges(
        new ContentData(html),
        new ContentData(html),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.NO_CHANGE);
    });

    it('detects new content', function() {
      const html = 'Here is some <b>HTML</b>';
      const page = new Page('test', {changeThreshold: 100});

      const result = scanContentModule.__.getChanges(
        new ContentData(null),
        new ContentData(html),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.NEW_CONTENT);
    });

    it('detects minor changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      const page = new Page('test', {changeThreshold: 100});

      spyOn(scanContentModule.__, 'isMajorChange').and.returnValues(false);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1),
        new ContentData(html2),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MINOR_CHANGE);
    });

    it('detects major changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html2 = 'Here is some different <b>HTML</b>';
      const page = new Page('test', {changeThreshold: 100});

      spyOn(scanContentModule.__, 'isMajorChange')
        .and
        .returnValues(true);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1),
        new ContentData(html2),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MAJOR_CHANGE);
    });
  });

  describe('getChangesParts', function() {
    it('detects identical page parts', function() {
      const html = 'Here is some <b>HTML</b>';
      const htmlParts = html.split(' ');
      const page = new Page('test', {changeThreshold: 100});

      const result = scanContentModule.__.getChanges(
        new ContentData(html, htmlParts),
        new ContentData(html, htmlParts),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.NO_CHANGE);
    });

    it('detects minor part changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html1Parts = html1.split(' ');
      const html2 = 'Here is some different <b>HTML</b>';
      const html2Parts = html2.split(' ');
      const page = new Page(
        'test',
        {changeThreshold: 100, requireExactMatchCount: false},
      );

      spyOn(scanContentModule.__, 'isMajorChange').and.returnValues(false);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1, html1Parts),
        new ContentData(html2, html2Parts),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MINOR_CHANGE);
    });

    it('detects major changes', function() {
      const html1 = 'Here is some <b>HTML</b>';
      const html1Parts = html1.split(' ');
      const html2 = 'Here is some different <b>HTML</b>';
      const html2Parts = html2.split(' ');
      const page = new Page('test', {changeThreshold: 100});

      spyOn(scanContentModule.__, 'isMajorChange')
        .and
        .returnValues(true);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1, html1Parts),
        new ContentData(html2, html2Parts),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MAJOR_CHANGE);
    });

    it('detects count change as major change', function() {
      const html1 = '<>';
      const html1Parts = ['<>'];
      const html2 = '<>';
      const html2Parts = ['<', '>'];
      const page = new Page('test', {requireExactMatchCount: true});

      const result = scanContentModule.__.getChanges(
        new ContentData(html1, html1Parts),
        new ContentData(html2, html2Parts),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MAJOR_CHANGE);
    });
  });

  describe('contentMode', function() {
    it('detects no change with content mode text', function() {
      const html1 = '<div>some text</div>';
      const html2 = '<span>some text</span>';
      const page = new Page(
        'test',
        {contentMode: Page.contentModeEnum.TEXT},
      );

      const result = scanContentModule.__.getChanges(
        new ContentData(html1),
        new ContentData(html2),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.NO_CHANGE);
    });

    it('detects major change with content mode HTML', function() {
      const html1 = '<div>some text</div>';
      const html2 = '<span>some text</span>';
      const page = new Page(
        'test',
        {contentMode: Page.contentModeEnum.HTML},
      );

      spyOn(scanContentModule.__, 'isMajorChange')
        .and
        .returnValues(true);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1),
        new ContentData(html2),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.MAJOR_CHANGE);
    });

    it('detects no change with content mode IGNORE', function() {
      const html1 = '<div>some text</div>';
      const html2 = '<span>some other text</span>';
      const page = new Page(
        'test',
        {contentMode: Page.contentModeEnum.IGNORE},
      );

      spyOn(scanContentModule.__, 'isMajorChange')
        .and
        .returnValues(true);

      const result = scanContentModule.__.getChanges(
        new ContentData(html1),
        new ContentData(html2),
        page,
      );

      expect(result).toEqual(scanContentModule.__.changeEnum.NO_CHANGE);
    });

    it(
      'detects minor change outside with content mode IGNORE and match count',
      function() {
        const html1 = '<div>some text</div>';
        const html1Split = ['<div>', '</div>'];
        const html2 = '<span>some other text</span>';
        const html2Split = ['<div>', '</div>'];
        const page = new Page(
          'test',
          {
            requireExactMatchCount: true,
            contentMode: Page.contentModeEnum.IGNORE,
          },
        );

        spyOn(scanContentModule.__, 'isMajorChange')
          .and
          .returnValues(true);

        const result = scanContentModule.__.getChanges(
          new ContentData(html1, html1Split),
          new ContentData(html2, html2Split),
          page,
        );

        expect(result).toEqual(scanContentModule.__.changeEnum.NO_CHANGE);
      },
    );
  });

  describe('stripHtml', function() {
    it('strips whitespace', function() {
      const prevHtml = 'text with\tspaces\ntabs  \n \r  and newlines';
      const scannedHtml = 'More text with\tspaces\ntabs  \n \r  and newlines';

      const resultPrevHtml = scanContentModule.__.stripHtml(
        prevHtml,
        false,
        false,
      );
      const resultScanHtml = scanContentModule.__.stripHtml(
        scannedHtml,
        false,
        false,
      );

      expect(resultPrevHtml).toEqual('textwithspacestabsandnewlines');
      expect(resultScanHtml).toEqual('Moretextwithspacestabsandnewlines');
    });

    it('strips scripts', function() {
      const html = 'text with<script blah>inline </script> script ' +
        '<script> tags</script>s';
      const html2 = 'text with <script>\nnewlines</script> of various' +
        '<script>\r\n   types\r\n</script>..';

      const result = scanContentModule.__.stripHtml(html, false, false);
      const result2 = scanContentModule.__.stripHtml(html2, false, false);

      expect(result).toEqual('textwithscripts');
      expect(result2).toEqual('textwithofvarious..');
    });

    it('strips tags', function() {
      const html = 'text with <b>tags</b> included.';
      const html2 = '<p>More text with<br/>tags</p>';

      const result = scanContentModule.__.stripHtml(html, false, true);
      const result2 = scanContentModule.__.stripHtml(html2, false, true);

      expect(result).toEqual('textwithtagsincluded.');
      expect(result2).toEqual('Moretextwithtags');
    });

    it('strips numbers if Page.ignoreNumbers is true', function() {
      const html = 'text with 12.3 numbers, 190 000 000, ' +
        '18,7, full stops and commas.';

      const result = scanContentModule.__.stripHtml(
        html,
        true,
        true,
      );

      expect(result).toEqual('textwithnumbers,,,fullstopsandcommas.');
    });

    it('doesn\'t strip numbers if Page.ignoreNumbers is false', function() {
      const html = 'text with 12.3 numbers, stops and commas.';

      const result = scanContentModule.__.stripHtml(
        html,
        false,
        false,
      );

      expect(result).toEqual('textwith12.3numbers,stopsandcommas.');
    });

    it('handles null HTML input', function() {
      const result = scanContentModule.__.stripHtml(null, true, true);

      expect(result).toBe(null);
    });
  });
});
