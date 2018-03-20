/**
 * Open the Update page URL.
 */
export function openUpdate() {
  const url = browser.extension.getURL('/app/update/update.html');
  browser.tabs.create({url: url});
}
