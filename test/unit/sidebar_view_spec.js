import {SidebarView} from '/lib/sidebar/sidebar_view.js';

describe('Sidebar', function() {
  describe('_generateTree', function() {
    it('generates a tree with an empty root', function() {
      const store = {getState: () => ({pages: {
        '0': {title: 'root', type: 'folder', children: []},
      }})};

      const tree = new SidebarView()._generateTree(store, '0');

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children).toEqual([]);
    });

    it('generates a tree with a single page', function() {
      const store = {getState: () => ({pages: {
        '0': {title: 'root', type: 'folder', children: ['1']},
        '1': {title: 'Page1', type: 'page'},
      }})};

      const tree = new SidebarView()._generateTree(store, '0');

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children.length).toEqual(1);
      expect(tree.children[0].id).toEqual('1');
      expect(tree.children[0].text).toEqual('Page1');
    });

    it('generates a tree with a single folder', function() {
      const store = {getState: () => ({pages: {
        '0': {title: 'root', type: 'folder', children: ['1']},
        '1': {title: 'subfolder', type: 'folder', children: []},
      }})};

      const tree = new SidebarView()._generateTree(store, '0');

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children.length).toEqual(1);
      expect(tree.children[0].id).toEqual('1');
      expect(tree.children[0].text).toEqual('subfolder');
      expect(tree.children[0].children).toEqual([]);
    });

    it('generates a tree with pages and folders', function() {
      const store = {getState: () => ({pages: {
        '0': {title: 'root', type: 'folder', children: ['1', '2']},
        '1': {title: 'subfolder', type: 'folder', children: ['3']},
        '2': {title: 'Page2', type: 'page'},
        '3': {title: 'Page3', type: 'page'},
      }})};

      const tree = new SidebarView()._generateTree(store, '0');

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
