import {Main} from '/lib/main/main.js';
import * as mainModule from '/lib/main/main.js';
import {Page} from '/lib/page/page.js';
import {StorageDB} from '/lib/util/storage_db.js';

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

  describe('_showDiff', function() {
    it('Updates the view with a diff of the old and new HTML from storage',
    function(done) {
      const id = '42';
      const page = new Page(id, {url: 'test.com/blah'});
      const html = 'hello';
      const main = new Main();

      spyOn(StorageDB, 'load').and.returnValue(Promise.resolve(html));
      spyOn(mainModule.__, 'diff').and.returnValues('diffHtml');
      spyOn(mainModule.__, 'viewDiff').and.callFake((pageArg, htmlArg) => {
        expect(htmlArg).toEqual(
          '<base href="test.com/blah" target="_top">diffHtml');
        expect(pageArg).toEqual(page);
        expect(StorageDB.load).toHaveBeenCalledWith('html:old:' + id);
        expect(StorageDB.load).toHaveBeenCalledWith('html:new:' + id);
        expect(mainModule.__.diff).toHaveBeenCalledWith(page, html, html);
        done();
      });

      main._showDiff(page);
    });

    it('logs to the console if the page\'s html isn\'t found', function(done) {
      const page = new Page(42, {url: 'test.com/blah'});
      const main = new Main();

      spyOn(mainModule.__, 'viewDiff');
      spyOn(StorageDB, 'load').and.returnValue(Promise.resolve(undefined));

      spyOn(mainModule.__, 'log').and.callFake((msg) => {
        expect(msg).toMatch('Could not load .* from storage');
      });

      main._showDiff(page).then(() => {
        expect(mainModule.__.log).toHaveBeenCalled();
        expect(mainModule.__.viewDiff).toHaveBeenCalledWith(
          page, '<base href="test.com/blah" target="_top">');
        done();
      });
    });
  });
});
