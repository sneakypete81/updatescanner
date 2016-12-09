/* exported Sidebar */
/* global PageFolder, Page */
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

  /*
   * Initialises the Sidebar.
   */
  init(pageMap, rootId) {
    const root = pageMap.get(rootId);

    $(this.sidebarDivSelector).jstree(
      {core: {data: this._generateTree(pageMap, root).children}});

    $(this.sidebarDivSelector).on('ready.jstree', (e, data) => {
      this._attachData(pageMap);
    });
  }

  /*
   * Generate a JSTree node from a pageMap object.
   *
   */
  _generateTree(pageMap, node) {
    let result = {};
    result.id = node.id;
    result.text = node.title;
    result.children = [];
    const children = node.children || [];
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

  _attachData(pageMap) {
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
