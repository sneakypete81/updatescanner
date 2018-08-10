import {qs, $on, $delegate, findParentWithClass,
  showElement, hideElement, isHidden} from '/lib/util/view_helpers.js';
import {waitForMs} from '/lib/util/promise.js';

/**
 * Initialise the Popup view.
 */
export function init() {
  $on(qs('#menu-button'), 'click', toggleMenu);
  $on(qs('#backup-menu'), 'click', showBackupPanel);
  $on(qs('#restore-menu'), 'click', showRestorePanel);
}

/**
 * @param {Function} handler - Called when the ShowAll button is clicked.
 */
export function bindShowAllClick(handler) {
  $on(qs('#show-all-button'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the New button is clicked.
 */
export function bindNewClick(handler) {
  $on(qs('#new-button'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the Sidebar button is clicked.
 */
export function bindSidebarClick(handler) {
  $on(qs('#sidebar-button'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the Help menu item is clicked.
 */
export function bindHelpClick(handler) {
  $on(qs('#help-menu'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the Backup button is clicked.
 */
export function bindBackupClick(handler) {
  $on(qs('#backup-button'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the Restore menu item is clicked.
 */
export function bindRestoreClick(handler) {
  $on(qs('#restore-button'), 'click', handler);
}

/**
 * @param {Function} handler - Called when the Scan All menu item is clicked.
 */
export function bindScanAllClick(handler) {
  $on(qs('#scan-all-menu'), 'click', handler);
}

/**
 * @param {Function} handler - Called when a Page list item is clicked.
 */
export function bindPageClick(handler) {
  // Match all elements that have .panel-list-item as a parent
  $delegate(qs('#list'), '.panel-list-item *', 'click', ({target}) => {
    // Search upwards to find .panel-list-item
    const item = findParentWithClass(target, 'panel-list-item');
    handler(item.dataset.id);
  });
}

/**
 * Add a page to the list of updated pages.
 *
 * @param {Page} page - Page to add.
 */
export function addPage(page) {
  qs('#list').appendChild(createListItem(page));
}

/**
 * Remove all items from the list of updated pages.
 */
export function clearPageList() {
  qs('#list').innerHTML = '';
}

/**
 * Download a Url object. Used for downloading backup JSON files. Awaits until
 * the click event has fired, so it's safe to release the ObjectURL.
 *
 * @param {Url} url - Url object to download.
 * @param {string} filename - Default filename for the download.
 */
export async function downloadUrl(url, filename) {
  const link = qs('#backup-link');
  link.href = url;
  link.download = filename;
  link.click();

  await waitForMs(0);
}

/**
 * Create a new list item for a Page.
 *
 * @param {Page} page - Page object to use for the list item.
 *
 * @returns {Element} List item for the given Page.
 */
function createListItem(page) {
  const item = document.createElement('div');
  item.className = 'panel-list-item';
  item.dataset.id = page.id;

  const icon = document.createElement('div');
  icon.className = 'icon';
  // const image = document.createElement('img');
  // image.src = '/images/updatescanner_18.png';
  // icon.appendChild(image);

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = page.title;

  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

/**
 * Display/hide the menu. When displayed, a click outside the menu will hide it.
 *
 * @param {Event} event - Event used to initiate the toggle.
 */
function toggleMenu(event) {
  const menu = qs('#menu');
  const body = qs('body');
  if (isHidden(menu)) {
    showElement(menu);
    body.addEventListener('click', toggleMenu);
    event.stopPropagation();
  } else {
    hideElement(menu);
    body.removeEventListener('click', toggleMenu);
  }
}

/**
 * Display the Backup panel.
 */
function showBackupPanel() {
  hideElement(qs('#main-panel'));
  showElement(qs('#backup-panel'));
}

/**
 * Display the Restore panel.
 */
function showRestorePanel() {
  hideElement(qs('#main-panel'));
  showElement(qs('#restore-panel'));
}
