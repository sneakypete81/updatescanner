/* exported Page */

class Page {
  static get pageTypes() {
    return {
      OLD: 'old',
      NEW: 'new',
      CHANGES: 'changes',
    };
  }

  constructor(id, data) {
    this.id = id;
    this.data = data;
  }
}
