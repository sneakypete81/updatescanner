/* exported Scan */
/* global PageStore */

// Promise-XHR example from https://github.com/mdn/promises-test

/**
 * Class used to scan a list of webpages.
 */
class Scan {
  /**
   * @param {Array.<Page>} pageList - Array of pages to scan.
   */
  constructor(pageList) {
    this.pageList = pageList;
  }

  /**
   * Start scanning the pages one at a time. HTML is saved to the PageStore, and
   * the Page objects are updated and saved accordingly.
   *
   * @returns {Promise} An empty promise that fulfills once all pages have been
   * scanned.
   */
  start() {
    // Construct a chain of Promises to scan each Page sequentially.
    let promiseChain = Promise.resolve(null);
    this.pageList.forEach((page) => {
      // The 'then' clause needs a dummy parameter to keep the chain sequential.
      promiseChain = promiseChain.then((_) => {
        return Scan._scanPage(page);
      });
    });
    return promiseChain;
  }

  /**
   * Scans a single page, saving the HTML to the PageStore and updating and
   * saving the Page object accordingly.
   *
   * @param {Page} page - Page to scan.
   *
   * @returns {Promise} Pomise that fulfils once the page has been scanned.
   */
  static _scanPage(page) {
    // Function to check the status of a fetch response.
    const checkStatus = function(response) {
      if (response.ok) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error(
          '[' + response.status + '] ' + response.statusText));
      }
    };

    return fetch(page.url)
      .then(checkStatus)
      .then((response) => response.text())
      .then((html) => {
        console.log('HTML: ' + html.slice(0, 50));
        PageStore.saveHtml(page.id, PageStore.htmlTypes.NEW, html);
      }).catch((error) => {
        console.log('Could not scan "' + page.title + '": ' + error);
      });
  }
}
