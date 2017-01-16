import {Main} from 'main/main';
import {Page} from 'page/page';
import {Storage} from 'util/storage';

describe('Main', function() {
  beforeEach(function() {
    // Add <div id="main"> to the DOM
    this.mainDiv = document.createElement('div');
    this.mainDiv.id = 'main';
    document.body.appendChild(this.mainDiv);
  });

  afterEach(function() {
    this.mainDiv.remove();
  });

  describe('_onSelect', function() {
    it('calls loadIframe with the page\'s html from storage', function(done) {
      const id = '42';
      const html = 'hello';
      const main = new Main();

      spyOn(Storage, 'load').and.returnValues(Promise.resolve(html));
      spyOn(main, '_loadIframe').and.callFake((result) => {
        expect(result).toEqual(html);
        done();
      });

      main._onSelect(new Page(id, {}));
    });

    it('logs to the console if the page\'s html isn\'t found', function(done) {
      const id = '42';
      const main = new Main();

      spyOn(main, '_loadIframe');
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));
      spyOn(console, 'log').and.callFake((msg) => {
        expect(msg).toMatch('Error:');
        expect(main._loadIframe).not.toHaveBeenCalled();
        done();
      });

      main._onSelect(new Page(id, {}));
    });
  });

  describe('_loadIframe', function() {
    it('loads html into an iframe', function() {
      const html = 'This is some <b>HTML</b>.';
      const main = new Main();

      main._loadIframe(html);

      const iframe = document.getElementById('frame');
      expect(iframe.srcdoc).toEqual(html);
    });

    it('loads html into an iframe if one exists already', function() {
      const html1 = 'This is some <b>HTML</b>.';
      const html2 = 'This is some more <b>HTML</b>.';
      const main = new Main();

      main._loadIframe(html1);
      main._loadIframe(html2);

      const iframe = document.getElementById('frame');
      expect(iframe.srcdoc).toEqual(html2);
    });
  });

  describe('_removeIframe', function() {
    it('removes the iframe if one exists already', function() {
      const main = new Main();
      const iframe = document.createElement('iframe');
      iframe.id = 'frame';
      this.mainDiv.appendChild(iframe);
      expect(this.mainDiv.hasChildNodes()).toBe(true);

      main._removeIframe();

      expect(this.mainDiv.hasChildNodes()).toBe(false);
    });

    it('does nothing if an iframe doesn\'t exist already', function() {
      const main = new Main();
      expect(this.mainDiv.hasChildNodes()).toBe(false);

      main._removeIframe();

      expect(this.mainDiv.hasChildNodes()).toBe(false);
    });
  });
});
