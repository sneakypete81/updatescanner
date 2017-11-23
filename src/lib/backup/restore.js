import {readAsText} from 'promise-file-reader';
import {PageStore} from 'page/page_store';
import {JSON_BACKUP_ID, JSON_BACKUP_VERSION} from 'backup/backup';

/**
 * Restore a backup from the specified file to the PageStore. Supports the
 * current backup format, and falls back to the old v3 bookmark format.
 * Doesn't clear the existing PageStore, assumes this has already been done if
 * required.
 *
 * @param  {PageStore} pageStore - Import items to this PageStore.
 * @param  {File} file - File object uploaded by the user.
 * @returns {string} Error message, or null if the operation succeeds.
 */
export async function restoreBackupFromFile(pageStore, file) {
  const json = await parseFile(file);
  if (isBackupValid(json)) {
    restoreBackupFromJson(pageStore, json);
  } else {
    restoreBookmarksFromJson(pageStore, json);
  }
  return null;
}

/**
 * @param {File} file - File object to read.
 *
 * @returns {Object} JSON object read from the file.
 */
async function parseFile(file) {
  return JSON.parse(await readAsText(file));
}

/**
 * @param {Object} json - JSON object to check.
 *
 * @returns {bool} True if the JSON object is a valid backup, false if it's not,
 * and raises an error if there's a version mismatch.
 */
function isBackupValid(json) {
  if (json.id === undefined || json.id != JSON_BACKUP_ID) {
    return false;
  }
  if (json.version === undefined || json.version != JSON_BACKUP_VERSION) {
    throw new Error(`JSON file version mismatch - ` +
      `expected ${JSON_BACKUP_VERSION} but was ${json.version}`);
  }
  return true;
}

/**
 * Recursively import Pages/PageFolders from a JSON object into the PageStore.
 *
 * @param {PageStore} pageStore - PageStore object to import into.
 * @param {Object} json - JSON object to import from.
 * @param {string} parentId - ID of the parent PageFolder object.
 */
async function restoreBackupFromJson(
  pageStore, json, parentId=PageStore.ROOT_ID
) {
  for (const child of json.children) {
    if (child.type == 'PageFolder') {
      const pageFolder = await pageStore.createPageFolder(parentId, -1);
      pageFolder.title = child.title;
      await pageFolder.save();
      await restoreBackupFromJson(pageStore, child, pageFolder.id);
    } else if (child.type == 'Page') {
      const page = await pageStore.createPage(parentId, -1, child);
      await page.save();
    }
  }
}

/**
 * Recursively import Pages/PageFolders from a Bookmarks JSON object into
 * the PageStore. Used to upgrade from UpdateScanner v3.
 *
 * @param {PageStore} pageStore - PageStore to import into.
 * @param {Object} json - JSON object to import from.
 */
async function restoreBookmarksFromJson(pageStore, json) {
}

  // if (view.confirmRestore()) {
  //   await this.pageStore.deleteItem(PageStore.ROOT_ID);
  //   await this.pageStore.createWebsitePage();
  //   view.confirmRestore();
  //   restoreBackupFromFile(this.pageStore, file);
  // }
