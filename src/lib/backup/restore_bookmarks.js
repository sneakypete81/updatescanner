import {PageStore} from '/lib/page/page_store.js';
/**
 * Recursively import Pages/PageFolders from a Bookmarks JSON object into
 * the PageStore. Used to upgrade from UpdateScanner v3.
 *
 * @param {PageStore} pageStore - PageStore to import into.
 * @param {Object} json - JSON object to import from.
 */
export async function restoreBookmarksFromJson(pageStore, json) {
  const root = findRoot(json.children);
  if (root === undefined) {
    throw new Error('Could not find Update Scanner root bookmark folder.');
  }
  await importPages(pageStore, root, PageStore.ROOT_ID);
}

/**
 * Find the Update Scanner root bookmark folder.
 *
 * @param {Object} bookmarks - Bookmark object to search.
 * @returns {Object} Root Bookmark folder.
 */
function findRoot(bookmarks) {
  for (let bookmarkIdx=0; bookmarkIdx < bookmarks.length; bookmarkIdx++) {
    const bookmark = bookmarks[bookmarkIdx];
    if (bookmark.hasOwnProperty('annos')) {
      for (let annoIdx=0; annoIdx < bookmark.annos.length; annoIdx++) {
        const anno = bookmark.annos[annoIdx];
        if (anno.name == 'updatescan/root') {
          return bookmark;
        }
      }
    }

    if (bookmark.hasOwnProperty('children')) {
      const result = findRoot(bookmark.children);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
}

/**
 * Import Update Scanner pages from a bookmarks object.
 *
 * @param {PageStore} pageStore - PageStore to import bookmarks into..
 * @param {Object} root - Update Scanner root bookmarks object.
 * @param {string} parentId - ID of the parent PageFolder object.
 */
async function importPages(pageStore, root, parentId) {
  for (const child of root.children) {
    if (child.hasOwnProperty('children')) {
      const pageFolder = await pageStore.createPageFolder(parentId, -1);
      pageFolder.title = child.title;
      await pageFolder.save();
      await importPages(pageStore, child, pageFolder.id);
    } else {
      const annos = extractAnnos(child);
      const page = await pageStore.createPage(parentId, -1);
      page.title = child.title;
      page.url = child.uri;
      page.scanRateMinutes = annos['updatescan/scan_rate_mins'];
      page.changeThreshold = annos['updatescan/threshold'];
      page.ignoreNumbers = (annos['updatescan/ignore_numbers'] == 1);
      page.encoding = (annos['updatescan/encoding']);
      page.highlightChanges = (annos['updatescan/highlight_changes'] == 1);
      page.highlightColour = (annos['updatescan/highlight_colour']);
      page.markChanges = (annos['updatescan/mark_changes'] == 1);
      page.doPost = (annos['updatescan/request_method'] == 'post');
      page.postParams = (annos['updatescan/post_params']);
      await page.save();
    }
  }
}

/**
 * Extract a bookmark's annotations into an object.
 *
 * @param {Object} bookmark - Bookmark object to process.
 * @returns {Object} Object containing the bookmark's annotations.
 */
function extractAnnos(bookmark) {
  const annos = {};
  if (bookmark.hasOwnProperty('annos')) {
    bookmark.annos.forEach((anno) => {
      annos[anno.name] = anno.value;
    });
  }

  return annos;
}
