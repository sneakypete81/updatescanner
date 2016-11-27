/* exported PageFolder */

class PageFolder {
  constructor(data) {
    this.data = data;
    this.id = data.id;
    this.name = data.name;
    this.children = [];
  }

  loadChildren(loadPage) {
    if (this.data.children === undefined || this.data.children.length == 0) {
      return Promise.resolve(this);
    }
    // Make an array of promises, each returning a child
    let promises = [];
    for (let i=0; i<this.data.children.length; i++) {
      if (this.data.children[i] instanceof Object) {
        // A nested PageFolder - load its children
        promises.push(new PageFolder(this.data.children[i])
                      .loadChildren(loadPage));
      } else {
        // A Page - load its contents
        promises.push(loadPage(this.data.children[i]));
      }
    }

    // Resolve the promises in sequence, appending each child to this.children
    let promiseSequence = promises[0];
    for (let i=1; i<promises.length; i++) {
      promiseSequence = promiseSequence.then((child) => {
        this.children.push(child);
        return promises[i];
      });
    }
    // For the last promise, return this PageFolder
    return promiseSequence.then((child) => {
      this.children.push(child);
      return this;
    });
  }
}
