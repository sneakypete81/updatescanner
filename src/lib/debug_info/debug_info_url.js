/**
 * Parameter names for the Debug Info page URL parameters.
 * @readonly
 * @enum {string}
 */
export const paramEnum = {
  ID: 'id',
};

/**
 * Open the Debug Info page URL, passing the specified parameters.
 *
 * @param {string} pageId - ID of the page to debug.
 */
export function openDebugInfo(pageId) {
  const url = getDebugInfoUrl(pageId);
  browser.tabs.create({url: url});
}

/**
 * Returns the URL to open the Debug Info page.
 *
 * @param {string} pageId - ID of the page to debug.
 *
 * @returns {string} URL of the Debug Info page.
 */
function getDebugInfoUrl(pageId) {
  const url = new URL(
    browser.extension.getURL('/app/debug_info/debug_info.html'));
  url.searchParams.set(paramEnum.ID, pageId);
  return url.href;
}
