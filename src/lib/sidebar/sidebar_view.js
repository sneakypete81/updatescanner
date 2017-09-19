import $ from 'jquery';
import 'jstree';

import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {log} from 'util/log';

/**
 * Class representing the Update Scanner Sidebar.
 */
export class SidebarView {
  /**
   * @param {string} sidebarDivSelector - Selector for the div that will contain
   * the Sidebar.
   */
  constructor(sidebarDivSelector) {
    this.deleteHandler = null;
    this.sidebarDivSelector = sidebarDivSelector;
    $(this.sidebarDivSelector).jstree({
      core: {
        themes: {
          icons: false,
          dots: false,
        },
      },

      contextmenu: {
        select_node: false,
        items: this._getSidebarItems(),
      },

      plugins: [
        'contextmenu',
      ],
    });

    document.addEventListener('contextmenu', (evt) => evt.preventDefault());
  }

  /**
   * Load the sidebar with the specified tree of pages.
   *
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   * @param {string} rootId - ID of the root PageFolder.
   */
  load(pageMap, rootId) {
    const root = pageMap.get(rootId);
    $(this.sidebarDivSelector).jstree(true).settings.core.data =
      this._generateTree(pageMap, root).children;
  }

  /**
   * Refresh the tree view.
   */
  refresh() {
    $(this.sidebarDivSelector).jstree(true).refresh();
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
    for (let i = 0; i < children.length; i++) {
      const child = pageMap.get(children[i]);
      if (child instanceof Page) {
        result.children.push({
          id: child.id,
          text: child.title,
          li_attr: {
            class: this._getStateClass(child.state),
          },
        });
      } else if (child instanceof PageFolder) {
        result.children.push(this._generateTree(pageMap, child));
      } else {
        log('Unknown node type: ' + child);
      }
    }
    return result;
  }

  /**
   * @param {Page.stateEnum} state - State of the page.
   *
   * @returns {string} CSS class to use for the tree element.
   */
  _getStateClass(state) {
    switch (state) {
      case Page.stateEnum.CHANGED:
        return 'changed';
      case Page.stateEnum.ERROR:
        return 'error';
    }
    return '';
  }

  /**
   * @returns {Object} Object containing sidebar configuration items.
   */
  _getSidebarItems() {
    return (node) => {
      return {
        delete: {
          label: 'Delete',
          action: () => this.deleteHandler(node),
        },
      };
    };
  }

  /**
   * Registers the provided handler function to be called whenever a single
   * item in the sidebar is selected.
   *
   * @param {Object} handler - Callback to use whenever the sidebar selection
   * changes.
   */
  registerSelectHandler(handler) {
    $(this.sidebarDivSelector).on('changed.jstree', (evt, data) => {
      if (data.selected.length == 1) {
        const id = data.selected[0];
        handler(id);
      }
    });
  }

  /**
   * Registers the provided handler function to be called whenever a tree
   * refresh completes.
   *
   * @param {Object} handler - Callback to use whenever a refresh completes.
   */
  registerRefreshDoneHandler(handler) {
    $(this.sidebarDivSelector).on('refresh.jstree', (evt, data) => {
      handler();
    });
  }

  /**
   * Registers the provided handler function to be called whenever a tree
   * node is to be deleted..
   *
   * @param {Object} handler - Callback to use whenever a node is to be deleted.
   */
  registerDeleteHandler(handler) {
    this.deleteHandler = (node) => {
      handler(node.id);
    };
  }
}
