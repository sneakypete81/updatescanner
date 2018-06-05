import {detectEncoding, applyEncoding} from '/lib/util/encoding.js';

describe('encoding', function() {
  describe('detectEncoding', function() {
    it('extracts encoding from headers', function() {
      const headers = new Headers(
        {'Content-Type': 'text/html; charset=utf-8;'}
      );

      const encoding = detectEncoding(headers, '');

      expect(encoding).toEqual('utf-8');
    });

    it('extracts encoding from html with charset attribute', function() {
      const headers = new Headers();
      const html = '<meta charset="utf-8"';

      const encoding = detectEncoding(headers, html);

      expect(encoding).toEqual('utf-8');
    });

    it('extracts encoding from html with http-equiv attribute', function() {
      const headers = new Headers();
      const html = '<meta http-equiv="Content-Type" ' +
        'content="text/html; charset=utf-8">';

      const encoding = detectEncoding(headers, html);

      expect(encoding).toEqual('utf-8');
    });
  });

  describe('applyEncoding', function() {
    it('decodes a windows-1251 buffer', function() {
      const bytes = new Uint8Array([236, 232, 240, 33]);

      const string = applyEncoding(bytes, 'windows-1251');

      expect(string).toEqual('мир!');
    });

    it('defaults to utf-8 on error', function() {
      const bytes = new Uint8Array([0xc3, 0xbf, 0xc3, 0xa6]);
      spyOn(console, 'log');

      const string = applyEncoding(bytes, 'Error');

      expect(string).toEqual('ÿæ');
    });

    it('handles mixed case encoding names', function() {
      const bytes = new Uint8Array([236, 232, 240, 33]);

      const string = applyEncoding(bytes, 'WinDowS-1251');

      expect(string).toEqual('мир!');
    });
  });
});
