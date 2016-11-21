/* exported Sidebar */
/* eslint-env jquery */

class Sidebar {
  constructor(sidebarDivSelector) {
    this.sidebarDivSelector = sidebarDivSelector;
  }

  init() {
    $(this.sidebarDivSelector).jstree();
  }

  handleSelection(handler) {
    $(this.sidebarDivSelector).on('changed.jstree', handler);
  }
}
