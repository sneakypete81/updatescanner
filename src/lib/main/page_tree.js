import {PageFolder} from '../page/page_folder.js';

/**
 * Node representing a single page and all it's descendants.
 */
class PageNode {
  /**
   *
   * @param {Page|PageFolder} page - Page.
   * @property {boolean} isFolder - True if page in this node is folder.
   * @property {?Array<Page>} descendants - Array containing descendants.
   *   Null if not a folder.
   */
  constructor(page) {
    this.page = page;
    this.isFolder = page instanceof PageFolder;
    this.descendants = null;
  }
}

/**
 * Creates tree structure for a Page and all it's descendants.
 *
 * @param {string} pageId - Root page id.
 * @param {PageStore} pageStore - Page store.
 * @returns {PageNode} Page node for root page.
 */
export function createTreeForPage(pageId, pageStore) {
  const rootPage = pageStore.getItem(pageId);
  const rootNode = new PageNode(rootPage);
  if (rootNode.isFolder) {
    rootNode.descendants = pageStore.getDescendantPages(pageId);
  }
  return rootNode;
}
