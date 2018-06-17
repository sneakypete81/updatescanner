import {SidebarView} from '/lib/sidebar/sidebar_view.js';
import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';

describe('Sidebar', function() {
  describe('_generateTree', function() {
    it('generates a tree with an empty root', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: []})],
      ]);
      const tree = new SidebarView()._generateTree(map, map.get('0'));

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children).toEqual([]);
    });

    it('generates a tree with a single page', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: ['1']})],
        ['1', new Page('1', {title: 'Page1'})],
      ]);
      const tree = new SidebarView()._generateTree(map, map.get('0'));

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children.length).toEqual(1);
      expect(tree.children[0].id).toEqual('1');
      expect(tree.children[0].text).toEqual('Page1');
    });

    it('generates a tree with a single folder', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: ['1']})],
        ['1', new PageFolder('1', {title: 'subfolder', children: []})],
      ]);
      const tree = new SidebarView()._generateTree(map, map.get('0'));

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children.length).toEqual(1);
      expect(tree.children[0].id).toEqual('1');
      expect(tree.children[0].text).toEqual('subfolder');
      expect(tree.children[0].children).toEqual([]);
    });

    it('generates a tree with pages and folders', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: ['1', '2']})],
        ['1', new PageFolder('1', {title: 'subfolder', children: ['3']})],
        ['2', new Page('2', {title: 'Page2'})],
        ['3', new Page('3', {title: 'Page3'})],
      ]);
      const tree = new SidebarView()._generateTree(map, map.get('0'));

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children.length).toEqual(2);
      expect(tree.children[0].id).toEqual('1');
      expect(tree.children[0].text).toEqual('subfolder');
      expect(tree.children[0].children.length).toEqual(1);
      expect(tree.children[0].children[0].id).toEqual('3');
      expect(tree.children[0].children[0].text).toEqual('Page3');
      expect(tree.children[1].id).toEqual('2');
      expect(tree.children[1].text).toEqual('Page2');
    });
  });
});
