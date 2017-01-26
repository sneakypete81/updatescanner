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

export function openMain(params) {
    const url = new URL(browser.extension.getURL('/app/main/main.html'));
    for (const param in params) {
      if (params.hasOwnProperty(param)) {
        url.searchParams.set(param, params[param]);
      }
    }
    browser.tabs.update({url: url.href});
}
