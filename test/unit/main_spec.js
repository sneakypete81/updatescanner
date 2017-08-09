import {Main} from 'main/main';
import {Page} from 'page/page';
import {Storage} from 'util/storage';
import * as diff from 'diff/diff';
import * as mainView from 'main/main_view';
import * as log from 'util/log';

describe('Main', function() {
  beforeEach(function() {
    // Add <div id="frameContainer"> to the DOM
    this.frameContainer = document.createElement('div');
    this.frameContainer.id = 'frameContainer';
    document.body.appendChild(this.frameContainer);
  });

  afterEach(function() {
    this.frameContainer.remove();
  });

  describe('_handleSelect', function() {
    it('Updates the view with a diff of the old and new HTML from storage',
    function(done) {
      const id = '42';
      const page = new Page(id, {url: 'test.com/blah'});
      const html = 'hello';
      const main = new Main();

      spyOn(Storage, 'load').and.returnValue(Promise.resolve(html));
      spyOn(diff, 'diff').and.returnValues('diffHtml');
      spyOn(mainView, 'viewDiff').and.callFake((pageArg, htmlArg) => {
        expect(htmlArg).toEqual('<base href="test.com/blah">diffHtml');
        expect(pageArg).toEqual(page);
        expect(Storage.load).toHaveBeenCalledWith('html:old:' + id);
        expect(Storage.load).toHaveBeenCalledWith('html:new:' + id);
        expect(diff.diff).toHaveBeenCalledWith(page, html, html);
        done();
      });

      main._handleSelect(page);
    });

    it('logs to the console if the page\'s html isn\'t found', function(done) {
      const page = new Page(42, {url: 'test.com/blah'});
      const main = new Main();

      spyOn(mainView, 'viewDiff');
      spyOn(Storage, 'load').and.returnValue(Promise.resolve(undefined));

      spyOn(log, 'log').and.callFake((msg) => {
        expect(msg).toMatch('Could not load .* from storage');
      });

      main._handleSelect(page).then(() => {
        expect(log.log).toHaveBeenCalled();
        expect(mainView.viewDiff).toHaveBeenCalledWith(
          page, '<base href="test.com/blah">');
        done();
      });
    });
  });
});
