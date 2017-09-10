import {qs, $on} from 'util/view_helpers';
import {readAsText} from 'promise-file-reader';

/**
 * Class representing the Update Scanner upgrade page.
 */
export class Upgrade {
  /**
   * Initialise the upgrade page's content.
   */
  init() {
    $on(qs('#loadButton'), 'click', async (event) => {
      const file = qs('#fileInput').files[0];
      const bookmarks = await loadBookmarks(file);
      const root = findRoot(bookmarks.children);
      importPages(root);
    });
  }
}

/**
 * Read bookmarks from a JSON file.
 *
 * @param {Object} file - File object to import.
 * @returns {Object} Bookmark object read from the JSON file.
 */
async function loadBookmarks(file) {
  try {
    const text = await readAsText(file);
    return JSON.parse(text);
  } catch (e) {
    console.log(e);
  }
  return {};
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
 * @param {Object} root - Update Scanner root bookmarks object.
 */
function importPages(root) {
  console.log(root);
}
