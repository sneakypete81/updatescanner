/* exported PageFolder */

class PageFolder {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.children = [];
  }

  deserialise(data, loadPage) {
    this.id = data.id;
    this.name = data.name;
    this.children = [];

    if (data.children === undefined || data.children.length == 0) {
      return Promise.resolve(this);
    }

    // Make an array of promises, each returning a child
    let promises = [];
    for (let i=0; i<data.children.length; i++) {
      if (data.children[i] instanceof Object) {
        // A nested PageFolder - load its children
        promises.push(new PageFolder().deserialise(data.children[i], loadPage));
      } else {
        // A Page - load its contents
        promises.push(loadPage(data.children[i]));
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
