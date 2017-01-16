// @TODO: Don't need JQuery
import $ from 'jquery';

import {Sidebar} from 'main/sidebar';
import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';

describe('Sidebar', function() {
  describe('load', function() {
    beforeEach(function() {
      // Add <div id="tree"> to the DOM
      this.tree = document.createElement('div');
      this.tree.id = 'tree';
      document.body.appendChild(this.tree);
    });

    afterEach(function() {
      this.tree.remove();
    });

    it('populates a jstree in the DOM', function(done) {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: ['1', '2']})],
        ['1', new PageFolder('1', {title: 'subfolder', children: ['3']})],
        ['2', new Page('2', {title: 'Page2'})],
        ['3', new Page('3', {title: 'Page3'})],
      ]);

      new Sidebar('#tree').load(map, '0');

      $('#tree').on('ready.jstree', (e, data) => {
        const jstree = $('#tree').jstree(true);
        expect(jstree.get_node('#').children).toEqual(['1', '2']);
        expect(jstree.get_node('#').data).toEqual(map.get('0'));
        expect(jstree.get_node('1').text).toEqual('subfolder');
        expect(jstree.get_node('1').children).toEqual(['3']);
        expect(jstree.get_node('1').data).toEqual(map.get('1'));
        expect(jstree.get_node('2').text).toEqual('Page2');
        expect(jstree.get_node('2').data).toEqual(map.get('2'));
        expect(jstree.get_node('3').text).toEqual('Page3');
        expect(jstree.get_node('3').data).toEqual(map.get('3'));
        done();
      });
    });
  });

  describe('_generateTree', function() {
    it('generates a tree with an empty root', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: []})],
      ]);
      const tree = new Sidebar()._generateTree(map, map.get('0'));

      expect(tree.id).toEqual('0');
      expect(tree.text).toEqual('root');
      expect(tree.children).toEqual([]);
    });

    it('generates a tree with a single page', function() {
      const map = new Map([
        ['0', new PageFolder('0', {title: 'root', children: ['1']})],
        ['1', new Page('1', {title: 'Page1'})],
      ]);
      const tree = new Sidebar()._generateTree(map, map.get('0'));

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
      const tree = new Sidebar()._generateTree(map, map.get('0'));

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
      const tree = new Sidebar()._generateTree(map, map.get('0'));

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
