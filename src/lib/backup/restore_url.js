/**
 * Opens the Restore page.
 */
export function openRestoreUrl() {
  const url = browser.extension.getURL('/app/restore/restore.html');
  browser.tabs.create({url: url});
}
