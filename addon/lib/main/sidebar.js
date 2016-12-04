/* exported Sidebar */
/* global PageStore, PageFolder, Page */
/* eslint-env jquery */

/**
 * Class representing the Update Scanner Sidebar.
 */
class Sidebar {
  /**
   * @param {string} sidebarDivSelector - Selector for the div that will contain
   * the Sidebar.
   */
  constructor(sidebarDivSelector) {
    this.sidebarDivSelector = sidebarDivSelector;
  }

  /**
   * Initialises the Sidebar.
   */
  init() {
    PageStore.loadPageTree().then((pageTree) => {
      $(this.sidebarDivSelector).jstree(
        {core: {data: this._generateTree(pageTree).children}});
    });
  }

  /**
   * Generate a JSTree node from a PageFolder/PageTree object.
   *
   * @param {PageFolder} node - Root PageFolder node.
   *
   * @returns {Object} JSTree node generated from the PageFolder.
   */
  _generateTree(node) {
    let result = {};
    result.data = node;
    result.id = node.id;
    result.text = node.name;
    result.children = [];
    for (let i=0; i<node.children.length; i++) {
      const child = node.children[i];
      if (child.type == Page.TYPE) {
        result.children.push({data: child,
                              id: child.id,
                              text: child.name});
      } else if (child.type == PageFolder.TYPE) {
        result.children.push(this._generateTree(child));
      } else {
        console.log('Unknown node type: ' + child.type);
      }
    }
    return result;
  }

  /**
   * Callback for handling Sidebar selection changes.
   * @callback Sidebar~selectHandler
   * @param {string} id - ID of the selected item.
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
        handler(id, data.instance.get_node(id).data);
      }
    });
  }
}
