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
      if (file) {
        const bookmarks = await loadBookmarks(file);
        if (bookmarks) {
          importPages(bookmarks);
        }
      }
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
  return;
}

/**
 * Import Update Scanner pages from a bookmarks object.
 *
 * @param {Object} bookmarks - Bookmark object to import pages from.
 */
function importPages(bookmarks) {
  console.log(bookmarks);
}
