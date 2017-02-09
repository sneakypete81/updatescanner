import {highlightDiffs} from 'diff/diff_engine';

describe('diff_engine', function() {
  describe('diff', function() {
    it('highlights inserted text', function() {
      const html1 = '<html><body>This is some text.</body></html>';
      const html2 = '<html><body>This is some inserted text.</body></html>';

      const result = highlightDiffs(html1, html2, 'yellow', '', '');

      expect(result).toEqual(
        '<html><body>This is some ' +
        '<span style="background-color: yellow;">inserted </span>' +
        'text.</body></html>\n');
    });

    it('highlights moved text', function() {
      const html1 = '<html><body>This is some text.</body></html>';
      const html2 = '<html><body>This is text some.</body></html>';

      const result = highlightDiffs(html1, html2, 'yellow', '', '');

      expect(result).toEqual(
        '<html><body>This is ' +
        '<span style="background-color: yellow;">text some.</span>' +
        '</body></html>\n');
    });

    it('ignores deleted text', function() {
      const html1 = '<html><body>This is some text.</body></html>';
      const html2 = '<html><body>This is text.</body></html>';

      const result = highlightDiffs(html1, html2, 'yellow', '', '');

      expect(result).toEqual(html2 + '\n');
    });

    it('returns the NEW HTML if OLD HTML is undefined', function() {
      const html1 = undefined;
      const html2 = '<html><body>This is some text.</body></html>';

      const result = highlightDiffs(html1, html2, 'yellow', '', '');

      expect(result).toEqual(html2);
    });

    it('returns an empty string if the NEW HTML is undefined', function() {
      const html1 = '<html><body>This is some text.</body></html>';
      const html2 = undefined;

      const result = highlightDiffs(html1, html2, 'yellow', '', '');

      expect(result).toEqual('');
    });
  });
});
