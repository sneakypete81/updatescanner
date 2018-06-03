import * as view from './update_view.js';
import {PageStore} from '/lib/page/page_store.js';
import {Config} from '/lib/util/config.js';

export const latestVersion = 1;

/**
 * Check if the data structures are updated to the latest version.
 *
 * @returns {bool} True if the data structures are up to date.
 */
export async function isUpToDate() {
  const config = await new Config().load();
  const currentVersion = config.get('updateVersion');

  return currentVersion == latestVersion;
}

/**
 * Update data structures to the latest version.
 */
export async function update() {
  view.showUpdating();

  const config = await new Config().load();
  const currentVersion = config.get('updateVersion');

  try {
    if (currentVersion < 1) {
      await applyStorageDbUpdate();
      config.set('updateVersion', 1);
    }
    view.showComplete();
  } catch (error) {
    console.error(error);
    view.showFailed();
  }
  config.save();
}

/**
 * Move all page HTML from storage.local to indexedDB.
 */
async function applyStorageDbUpdate() {
  const pageStore = await PageStore.load();
  for (const page of pageStore.getPageList()) {
    await copyHtmlToStorageDb(page, PageStore.htmlTypes.OLD);
    await copyHtmlToStorageDb(page, PageStore.htmlTypes.NEW);
    await PageStore.deleteHtmlFromDeprecatedStorage(page.id);
  }
}

/**
 * Copy the specified page's HTML from storage.local to indexedDB.
 *
 * @param {string} page - Page to update.
 * @param {PageStore.htmlTypes} htmlType - Which HTML type to copy.
 */
async function copyHtmlToStorageDb(page, htmlType) {
  const html = await PageStore.loadHtmlFromDeprecatedStorage(page.id, htmlType);

  if (html !== null) {
    await PageStore.saveHtml(page.id, htmlType, html);
  }
}
