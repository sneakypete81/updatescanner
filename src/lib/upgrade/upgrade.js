import {qs, $on} from 'util/view_helpers';
import {readAsText} from 'promise-file-reader';
import {PageStore} from 'page/page_store';

/**
 * Class representing the Update Scanner upgrade page.
 */
export class Upgrade {
  /**
   * Initialise the upgrade page's content.
   */
  init() {
    $on(qs('#file-upload'), 'change', async (event) => {
      hideElement(qs('#upload-button'));
      hideElement(qs('#upgrade-failed'));

      const file = qs('#file-upload').files[0];
      const bookmarks = await loadBookmarks(file);
      const root = findRoot(bookmarks.children);

      if (root === undefined) {
        showElement(qs('#upload-button'));
        showElement(qs('#upgrade-failed'));
      } else {
        const pageStore = await PageStore.load();
        await importPages(pageStore, root, PageStore.ROOT_ID);

        showElement(qs('#upgrade-complete'));
      }
    });
  }
}


/**
 * @param {Element} element - Element to show.
 */
function showElement(element) {
  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
  }
}

/**
 * @param {Element} element - Element to hide.
 */
function hideElement(element) {
  if (!element.classList.contains('hidden')) {
    element.classList.add('hidden');
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
  return {children: []};
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
  root.children.forEach(async (child) => {
    if (child.hasOwnProperty('children')) {
      const pageFolder = await pageStore.createPageFolder(parentId);
      pageFolder.title = child.title;
      pageFolder.save();
      importPages(pageStore, child, pageFolder.id);
    } else {
      const annos = extractAnnos(child);
      const page = await pageStore.createPage(parentId);
      page.title = child.title;
      page.url = child.uri;
      page.scanRateMinutes = annos['updatescan/scan_rate_mins'];
      page.changeThreshold = annos['updatescan/threshold'];
      page.ignoreNumbers = (annos['updatescan/ignore_numbers'] == 1);
      page.save();
    }
  });
}

/**
 * Extract a bookmark's annotations into an object.
 *
 * @param {Object} bookmark - Bookmark object to process.
 * @returns {Object} Object containing the bookmark's annotations.
 */
function extractAnnos(bookmark) {
  let annos = {};
  bookmark.annos.forEach((anno) => {
    annos[anno.name] = anno.value;
  });

  return annos;
}
