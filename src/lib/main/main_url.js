/**
 * Parameter names for the Main page URL parameters.
 * @readonly
 * @enum {string}
 */
export const paramEnum = {
  ACTION: 'action',
  ID: 'id',
};

/**
 * Values for the Main page action URL parameter.
 * @readonly
 * @enum {string}
 */
export const actionEnum = {
  NEW: 'new',
  DIFF: 'diff',
};


/**
 * Open the Main page URL, passing the specified parameters.
 *
 * @param {Object} params - Object containing paramEnum key/values.
 * @param {boolean} newTab - Open the page in a new tab.
 */
export function openMain(params, newTab) {
    const url = new URL(browser.extension.getURL('/app/main/main.html'));
    for (const param in params) {
      if (params.hasOwnProperty(param)) {
        url.searchParams.set(param, params[param]);
      }
    }
    if (newTab) {
      browser.tabs.create({url: url.href});
    } else {
      browser.tabs.update({url: url.href});
    }
}
