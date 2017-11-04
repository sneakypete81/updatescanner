import $ from 'jquery';
import 'jstree';

import {Page} from 'page/page';
import {PageFolder} from 'page/page_folder';
import {PageStore} from 'page/page_store';
import {log} from 'util/log';
import {qs, showElement, hideElement} from 'util/view_helpers';

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
    this._moveHandler = null;
    this._settingsHandler = null;

    this._sidebarDivSelector = sidebarDivSelector;
    $(this._sidebarDivSelector).jstree({
      core: {
        multiple: false,
        themes: {
          icons: false,
          dots: false,
        },
        check_callback: (operation, node, parent, position, more) =>
          this._onTreeChanged(operation, node, parent, position, more),
      },

      contextmenu: {
        select_node: false,
        items: this._getContextMenuItems(),
      },

      plugins: [
        'contextmenu',
        'dnd',
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
    result.data = {isFolder: true};
    const children = root.children || [];
    for (let i = 0; i < children.length; i++) {
      const child = pageMap.get(children[i]);
      if (child instanceof Page) {
        result.children.push({
          id: child.id,
          text: child.title,
          data: {isFolder: false},
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
   * @param {Object} node - JSTree node.
   *
   * @returns {string} ItemId for the specified node.
   */
  _nodeToItemId(node) {
    if (node.id == '#') {
      return PageStore.ROOT_ID;
    } else {
      return node.id;
    }
  }

  /**
   * @returns {Object} Object containing sidebar context menu items.
   */
  _getContextMenuItems() {
    return (node) => {
      return {
        newPage: {
          label: 'New Page',
          action: () => this._newPageHandler(node),
        },
        newPageFolder: {
          label: 'New Folder',
          action: () => this._newPageFolderHandler(node),
        },
        delete: {
          separator_before: true,
          label: 'Delete',
          action: () => this._deleteHandler(node),
        },
        settings: {
          separator_before: true,
          label: 'Settings',
          action: () => this._settingsHandler(node),
        },
      };
    };
  }


  /**
   * Called whenever a DnD operation causes the tree to change. See JSTree docs
   * for full details.
   *
   * @param {string} operation - Operation performed on the tree (move_node).
   * @param {Object} node - Node that moved.
   * @param {Object} parent - New parent of the node.
   * @param {integer} position - New position within the parent.
   * @param {Object} more - Other data associated with the operation.
   *
   * @returns {boolean} True if the operation is allowed.
   */
  _onTreeChanged(operation, node, parent, position, more) {
    // Only the move operation is valid
    if (operation != 'move_node') {
      return false;
    }
    // Only allow DnD onto a Folder
    if (parent.id != '#' && !parent.data.isFolder) {
      return false;
    }
    // more.core is true if a drop has occurred
    if (more.core) {
      this._moveHandler(
        this._nodeToItemId(node), this._nodeToItemId(parent), position);
    }
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
   * Registers the provided handler function to be called whenever a tree
   * node is to be moved due to a DnD operaion.
   *
   * @param {Object} handler - Callback to use whenever a node is to be moved.
   */
  registerMoveHandler(handler) {
    this._moveHandler = (itemId, parentId, position) =>
      handler(itemId, parentId, position);
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

  /**
   * Show the Upgrade information text in the sidebar.
   */
  showUpgradeText() {
    showElement(qs('#upgrade'));
  }

  /**
   * Don't show the Upgrade information text in the sidebar.
   */
  hideUpgradeText() {
    hideElement(qs('#upgrade'));
  }

  /**
   * Show a dialog asking for confirmation before deleting an item.
   *
   * @returns {boolean} True if the user confirmed the deletion.
   */
  confirmDelete() {
    return window.confirm('Are you sure you wish to delete the selected item?');
  }
}
