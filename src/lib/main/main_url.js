/**
 * Parameter names for the Main page URL parameters.
 * @readonly
 * @enum {string}
 */
export const paramEnum = {
  ACTION: 'action',
  ID: 'id',
  TITLE: 'title',
  URL: 'url',
  PARENT_ID: 'parentId',
  INSERT_AFTER_INDEX: 'insertAfterIndex',
};

/**
 * Values for the Main page action URL parameter.
 * @readonly
 * @enum {string}
 */
export const actionEnum = {
  NEW_PAGE: 'new_page',
  SHOW_DIFF: 'show_diff',
};


/**
 * Open the Main page URL, passing the specified parameters.
 *
 * @param {Object} params - Object containing paramEnum key/values.
 * @param {boolean} newTab - Open the page in a new tab.
 */
export function openMain(params, newTab) {
  const url = getMainUrl(params);
  if (newTab) {
    browser.tabs.create({url: url});
  } else {
    browser.tabs.update({url: url});
  }
}

/**
 * Returns the URL to open the Main page, passing the specified parameters.
 *
 * @param {Object} params - Object containing paramEnum key/values.
 *
 * @returns {string} URL of the Main page.
 */
function getMainUrl(params) {
  const url = new URL(browser.extension.getURL('/app/main/main.html'));
  for (const [param, value] of Object.entries(params)) {
    url.searchParams.set(param, value);
  }
  return url.href;
}

/**
 * Returns the URL to open the Main page showing a diff.
 *
 * @param {string} pageId - ID of the Page to diff.
 *
 * @returns {string} URL of the Main page.
 */
export function getMainDiffUrl(pageId) {
  const params = {
    [paramEnum.ACTION]: actionEnum.SHOW_DIFF,
    [paramEnum.ID]: pageId,
  };
  return getMainUrl(params);
}
