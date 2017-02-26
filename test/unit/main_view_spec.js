import {viewDiff} from 'main/main_view';
import {Page} from 'page/page';

function addElement(type, id) {
  const element = document.createElement(type);
  element.id = id;
  document.body.appendChild(element);
  return element;
}

describe('main_view', function() {
  beforeEach(function() {
    this.title = addElement('div', 'title');
    this.subtitle = addElement('div', 'subtitle');
    this.viewDropdown = addElement('select', 'view-dropdown');
    this.frameContainer = addElement('div', 'frameContainer');
  });

  afterEach(function() {
    this.title.remove();
    this.subtitle.remove();
    this.viewDropdown.remove();
    this.frameContainer.remove();
  });

  describe('viewDiff', function() {
    it('loads html into an iframe', function() {
      const html = 'This is some <b>HTML</b>.';
      const page = new Page(0, {});

      viewDiff(page, html);

      const iframe = document.getElementById('frame');
      expect(iframe.srcdoc).toEqual(html);
    });

    it('loads html into an iframe if one exists already', function() {
      const html1 = 'This is some <b>HTML</b>.';
      const html2 = 'This is some more <b>HTML</b>.';
      const page = new Page(0, {});

      viewDiff(page, html1);
      viewDiff(page, html2);

      const iframe = document.getElementById('frame');
      expect(iframe.srcdoc).toEqual(html2);
    });
  });
});
