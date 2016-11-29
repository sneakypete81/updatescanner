/* exported Sidebar */
/* eslint-env jquery */

/**
 * Class representing the Update Scanner Sidebar.
 */
class Sidebar {
  /**
   * Sidebar constructor.
   *
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
    $(this.sidebarDivSelector).jstree();
  }

  /**
   * Callback for handling Sidebar selection changes.
   * @callback Sidebar~selectHandler
   * @param {Event} evt - Event that caused the selection change.
   * @param {string} data - Data associated with the new selection.
   */

  /**
   * Registers the provided handler function to be called whenever the Sidebar
   * selection changes.
   *
   * @param {Sidebar~selectHandler} handler - Callback to use whenever the
   * sidebar selection changes.
   */
  registerSelectHandler(handler) {
    $(this.sidebarDivSelector).on('changed.jstree', handler);
  }
}
