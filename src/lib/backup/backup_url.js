/**
 * Opens the Restore page.
 */
export function openRestoreUrl() {
  const url = browser.extension.getURL('/app/backup_restore/restore.html');
  browser.tabs.create({url: url});
}
