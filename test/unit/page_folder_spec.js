/* global PageFolder */

describe('page_folder', function() {
  beforeEach(function() {
    // sinon-chrome-webextensions currently exports 'chrome' for some reason
    /* global browser:true */
    browser = chrome;
    browser.flush();
  });

  afterEach(function() {
    /* eslint no-delete-var: 'off' */
    delete browser;
  });

  describe('deserialise', function() {
    it('does nothing if the children list is undefined', function(done) {
      const pageFolder = new PageFolder();
      const data = {};

      pageFolder.deserialise(data).then((result) => {
        expect(pageFolder.children).toEqual([]);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('does nothing if there are no children', function(done) {
      const pageFolder = new PageFolder();
      const data = {children: []};

      pageFolder.deserialise(data).then((result) => {
        expect(pageFolder.children).toEqual([]);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('loads child pages with no hierarchy', function(done) {
      const pageFolder = new PageFolder();
      const data = {id: 0, name: 'root', children: [1, 2]};

      const loadPageSpy = jasmine.createSpy('loadPage').and.returnValues(
        Promise.resolve('Page1'),
        Promise.resolve('Page2'));

      pageFolder.deserialise(data, loadPageSpy).then((result) => {
        expect(pageFolder.id).toEqual(0);
        expect(pageFolder.name).toEqual('root');
        expect(pageFolder.children).toEqual(['Page1', 'Page2']);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('loads child pages with subfolder hierarchy', function(done) {
      const pageFolder = new PageFolder();
      const data = {id: 0, name: 'root', children: [1, 2,
                    {id: 3, name: 'Subfolder', children: [4, 5]}]};

      const loadPageSpy = jasmine.createSpy('loadPage').and.returnValues(
        Promise.resolve('Page1'),
        Promise.resolve('Page2'),
        Promise.resolve('Page4'),
        Promise.resolve('Page5'));

      pageFolder.deserialise(data, loadPageSpy).then((result) => {
        const subFolder = pageFolder.children[2];
        expect(subFolder).toEqual(jasmine.any(PageFolder));
        expect(subFolder.id).toEqual(3);
        expect(subFolder.name).toEqual('Subfolder');
        expect(subFolder.children[0]).toEqual('Page4');
        expect(subFolder.children[1]).toEqual('Page5');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });
});
