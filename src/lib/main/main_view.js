import {qs, $on} from 'util/view_helpers';
import {timeSince} from 'util/date_format';

export const ViewTypes = {
  OLD: 'old',
  NEW: 'new',
  DIFF: 'diff',
};

/**
 */
export function bindMenu() {
  const menu = qs('#menu');

  // Toggle the menu when its button is clicked
  $on(qs('#menuButton'), 'click', (event) => {
    menu.classList.toggle('menu-show');
    event.stopPropagation();
  });

  // Hide the menu when something else is clicked
  $on(window, 'click', ({target}) => {
    if (menu.classList.contains('menu-show')) {
      menu.classList.remove('menu-show');
    }
  });
}

/**
 * @param {Function} handler - Called when the View Dropdown choice changes.
 */
export function bindViewDropdownChange(handler) {
  $on(qs('#view-dropdown'), 'change', ({target}) => {
    if (target.value) {
      handler(target.value);
    }
  });
}

/**
 * Show the diff view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {string} html - HTML string with diff highlighting.
 */
export function viewDiff(page, html) {
  setTitle(page.title, page.url);
  if (page.newScanTime !== undefined) {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This page was last scanned ${scanTime}. ` +
      'The changes are highlighted.');
  }
  setViewDropdown(ViewTypes.DIFF);
  loadIframe(html);
}

/**
 * Show the old view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {string} html - Old HTML string.
 */
export function viewOld(page, html) {
  setTitle(page.title, page.url);
  if (page.oldScanTime !== undefined) {
    const scanTime = timeSince(new Date(page.oldScanTime));
    setSubtitle(`This is the old version of the page, scanned ${scanTime}.`);
  }
  setViewDropdown(ViewTypes.OLD);
  loadIframe(html);
}

/**
 * Show the new view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {string} html - New HTML string.
 */
export function viewNew(page, html) {
  setTitle(page.title, page.url);
  if (page.newScanTime !== undefined) {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This is the new version of the page, scanned ${scanTime}.`);
  }
  setViewDropdown(ViewTypes.NEW);
  loadIframe(html);
}

/**
 * @param {string} title - Title of the page.
 * @param {string} url - URL of the page.
 */
function setTitle(title, url) {
  const titleElement = qs('#title');
  titleElement.textContent = title;
  titleElement.href = url;
}

/**
 * @param {string} subtitle - Subtitle text to use below the main title (eg.
 * describing when the page was last updated).
 */
function setSubtitle(subtitle) {
  const subtitleElement = qs('#subtitle');
  subtitleElement.textContent = subtitle;
}

/**
 * @param {ViewTypes} viewType - New value of the dropdown selection.
 */
function setViewDropdown(viewType) {
  const viewDropdown = qs('#view-dropdown');
  viewDropdown.value = viewType;
}

/**
 * Creates a content iframe and inserts it into the main content area.
 *
 * @param {string} html - HTML to load.
 */
function loadIframe(html) {
  removeIframe();
  const iframe = document.createElement('iframe');
  iframe.id = 'frame';
  iframe.sandbox = '';
  iframe.srcdoc = html;
  qs('#frameContainer').appendChild(iframe);
}

/**
 * Remove the iframe from the DOM, if it exists.
 */
function removeIframe() {
  const iframe = qs('#frame');
  if (iframe) {
    iframe.parentNode.removeChild(iframe);
  }
}
