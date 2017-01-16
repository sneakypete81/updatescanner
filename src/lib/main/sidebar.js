import $ from 'jquery';
import 'jstree';

import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';

/**
 * Class representing the Update Scanner Sidebar.
 */
export class Sidebar {
  /**
   * @param {string} sidebarDivSelector - Selector for the div that will contain
   * the Sidebar.
   */
  constructor(sidebarDivSelector) {
    this.sidebarDivSelector = sidebarDivSelector;
  }

  /**
   * Load the sidebar with the specified tree of pages.
   *
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   * @param {string} rootId - ID of the root PageFolder.
   */
  load(pageMap, rootId) {
    const root = pageMap.get(rootId);

    $(this.sidebarDivSelector).jstree(
      {core: {themes: {dots: false},
              data: this._generateTree(pageMap, root).children}});

    $(this.sidebarDivSelector).on('ready.jstree', (e, data) => {
      this._setTreeData(pageMap);
    });
  }

  /**
   * Generate a JSTree data object from a pageMap object.
   *
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   * @param {Page|PageFolder} root - Node to use as the root of the tree.
   *
   * @returns {Object} Object containing the JSTree data generated from the
   * pageMap.
   */
  _generateTree(pageMap, root) {
    let result = {};
    result.id = root.id;
    result.text = root.title;
    result.children = [];
    const children = root.children || [];
    for (let i=0; i<children.length; i++) {
      const child = pageMap.get(children[i]);
      if (child instanceof Page) {
        result.children.push({id: child.id,
                              text: child.title});
      } else if (child instanceof PageFolder) {
        result.children.push(this._generateTree(pageMap, child));
      } else {
        console.log('Unknown node type: ' + child);
      }
    }
    return result;
  }

  /**
   * Add a Page/PageFolder object to the data attribute of each JSTree node.
   *
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   */
  _setTreeData(pageMap) {
    for (let [id, data] of pageMap) {
      // JSTree uses id='#' for the root node.
      if (id == '0') {
        id = '#';
      }
      $(this.sidebarDivSelector).jstree(true).get_node(id).data = data;
    }
  }

  /**
   * Callback for handling Sidebar selection changes.
   * @callback Sidebar~selectHandler
   * @param {Page|PageFolder} item - Selected Page or PageFolder object..
   */

  /**
   * Registers the provided handler function to be called whenever a single
   * item in the sidebar is selected.
   *
   * @param {Sidebar~selectHandler} handler - Callback to use whenever the
   * sidebar selection changes.
   */
  registerSelectHandler(handler) {
    $(this.sidebarDivSelector).on('changed.jstree', (evt, data) => {
      if (data.selected.length == 1) {
        const id = data.selected[0];
        handler(data.instance.get_node(id).data);
      }
    });
  }
}
