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
    this._newPageHandler = null;
    this._newPageFolderHandler = null;
    this._deleteHandler = null;
    this._settingsHandler = null;

    this._sidebarDivSelector = sidebarDivSelector;
    $(this._sidebarDivSelector).jstree({
      core: {
        multiple: false,
        themes: {
          icons: false,
          dots: false,
        },
      },

      contextmenu: {
        select_node: false,
        items: this._getContextMenuItems(),
      },

      plugins: [
        'contextmenu',
      ],
    });

    // Prevent the contextmenu from being shown - we use our own
    document.addEventListener('contextmenu', (evt) => evt.preventDefault());

    // Open links in the main window, not the sidebar
    document.addEventListener('click', (evt) => {
      if (evt.target.className == 'link') {
        browser.tabs.create({url: evt.target.href});
        evt.preventDefault();
      }
    });
  }

  /**
   * Load the sidebar with the specified tree of pages.
   *
   * @param {Map} pageMap - Map of Page and PageFolder objects, keyed by ID.
   * @param {string} rootId - ID of the root PageFolder.
   */
  load(pageMap, rootId) {
    const root = pageMap.get(rootId);
    $(this._sidebarDivSelector).jstree(true).settings.core.data =
      this._generateTree(pageMap, root).children;
  }

  /**
   * Refresh the tree view.
   */
  refresh() {
    $(this._sidebarDivSelector).jstree(true).refresh();
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
   * @returns {Object} Object containing sidebar context menu items.
   */
  _getContextMenuItems() {
    return (node) => {
      return {
        newPage: {
          label: 'New Page...',
          action: () => this._newPageHandler(node),
        },
        newPageFolder: {
          label: 'New Folder...',
          action: () => this._newPageFolderHandler(node),
        },
        delete: {
          separator_before: true,
          label: 'Delete',
          action: () => this._deleteHandler(node),
        },
        settings: {
          separator_before: true,
          label: 'Settings...',
          action: () => this._settingsHandler(node),
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
    $(this._sidebarDivSelector).on('changed.jstree', (evt, data) => {
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
    $(this._sidebarDivSelector).on('refresh.jstree', (evt, data) => {
      handler();
    });
  }

  /**
   * Registers the provided handler function to be called to create a new Page.
   *
   * @param {Object} handler - Callback to use to create a new Page.
   */
  registerNewPageHandler(handler) {
    this._newPageHandler = (node) => handler(node.id);
  }

  /**
   * Registers the provided handler function to be called to create a
   * new PageFolder.
   *
   * @param {Object} handler - Callback to use to create a new PageFolder.
   */
  registerNewPageFolderHandler(handler) {
    this._newPageFolderHandler = (node) => handler(node.id);
  }

  /**
   * Registers the provided handler function to be called whenever a tree
   * node is to be deleted.
   *
   * @param {Object} handler - Callback to use whenever a node is to be deleted.
   */
  registerDeleteHandler(handler) {
    this._deleteHandler = (node) => handler(node.id);
  }

  /**
   * Registers the provided handler function to be called whenever the
   * 'Settings' context menu item is selected..
   *
   * @param {Object} handler - Callback to use when 'Settings' is selected.
   */
  registerSettingsHandler(handler) {
    this._settingsHandler = (node) => handler(node.id);
  }
}
