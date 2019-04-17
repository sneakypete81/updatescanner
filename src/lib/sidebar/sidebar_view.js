/* eslint-env jquery */

import {Page} from '/lib/page/page.js';
import {PageFolder} from '/lib/page/page_folder.js';
import {PageStore} from '/lib/page/page_store.js';
import {log} from '/lib/util/log.js';
import {qs, $on} from '/lib/util/view_helpers.js';

// See https://bugzilla.mozilla.org/show_bug.cgi?id=840640
import dialogPolyfill from
  '/dependencies/module/dialog-polyfill/dist/dialog-polyfill.esm.js';

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
    this._scanItemHandler = null;
    this._settingsHandler = null;

    this._refreshing = false;

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

        // JSTree fails CSP checks if WebWorkers are enabled
        worker: false,
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
  }

  /**
   * Initialise the sidebar.
   */
  init() {
    // Prevent the contextmenu from being shown - we use our own
    document.addEventListener('contextmenu', (evt) => evt.preventDefault());

    // JSTree in the sidebar doesn't handle unusual clicks very well.
    // Override incorrect click behaviour here.
    document.addEventListener('click', (event) => {
      // Open links in the main window, not the sidebar
      if (event.target.classList.contains('link')) {
        browser.tabs.create({url: event.target.href});
        event.preventDefault();
      }

      // Handle middle-clicks on tree items
      const isJstreeClick = event.target.classList.contains('jstree-anchor');
      if (isJstreeClick && event.button == 1) {
        const data = {
          selected: [event.target.parentNode.id],
          event: event,
        };
        $(this._sidebarDivSelector).trigger('changed.jstree', data);
        event.preventDefault();
      }
    });

    this._initDialog();
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
   * Refresh the tree view. Blocks until the refresh is complete.
   */
  refresh() {
    this._refreshing = true;
    $(this._sidebarDivSelector).jstree(true).refresh();

    // (almost) immediately signal that we're no longer refreshing.
    // This gives time for the select event to fire and be ignored.
    window.setTimeout(() => this._refreshing = false, 0);
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
    const result = {};
    result.id = root.id;
    result.text = root.title;
    result.children = [];
    result.data = {isFolder: true};
    result.li_attr = {class: this._getStateClass(root.state)};
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
        scan: {
          separator_before: true,
          label: 'Scan Now',
          action: () => this._scanItemHandler(node),
        },
        settings: {
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
    $(this._sidebarDivSelector).on('changed.jstree', (event, data) => {
      // Ignore if the event was due to a refresh or if nothing is selected.
      if (!this._refreshing && data.selected.length == 1) {
        const id = data.selected[0];
        // Pass the event that caused the change, not the change event itself
        handler(data.event, id);
      }
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
   * 'Scan' context menu item is selected..
   *
   * @param {Object} handler - Callback to use when 'Scan' is selected.
   */
  registerScanItemHandler(handler) {
    this._scanItemHandler = (node) => handler(node.id);
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
   * Initialise the dialog box.
   */
  _initDialog() {
    const dialog = qs('#dialog-confirm');
    dialogPolyfill.registerDialog(dialog);
  }

  /**
   * Show a dialog asking for confirmation before deleting an item.
   *
   * @returns {boolean} True if the user confirmed the deletion.
   */
  async confirmDelete() {
    const dialog = qs('#dialog-confirm');
    const message = qs('#dialog-confirm-message');

    message.textContent = 'Delete this item - are you sure?';
    dialog.showModal();

    return new Promise((resolve, reject) => {
      $on(dialog, 'close', () => {
        resolve(dialog.returnValue == 'delete');
      });
    });
  }
}
