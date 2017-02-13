/**
 * Parameter names for the Page Settings URL parameters.
 * @readonly
 * @enum {string}
 */
export const paramEnum = {
  ID: 'id',
};

/**
 * Generate a Page Settings URL with the specified parameters.
 *
 * @param {string} pageId - ID of the page.
 *
 * @returns {string} URL string.
 */
export function getSettingsUrl(pageId) {
  const url = new URL(browser.extension.getURL('/app/settings/settings.html'));
  url.searchParams.set(paramEnum.ID, pageId);
  return url.href;
}
