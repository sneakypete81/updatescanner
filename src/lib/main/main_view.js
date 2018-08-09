import {qs, $on, hideElement, toggleElement}
  from '/lib/util/view_helpers.js';
import {timeSince} from '/lib/util/date_format.js';

export const ViewTypes = {
  OLD: 'old',
  NEW: 'new',
  DIFF: 'diff',
};

/**
 * Initialise the main view.
 */
export function init() {
  initMenu();
}

/**
 * Initialise the dropdown menu.
 */
function initMenu() {
  const menu = qs('#menu');

  // Toggle the menu when its button is clicked
  $on(qs('#menuButton'), 'click', (event) => {
    toggleElement(menu);
    // Prevent the click from immediately closing the dropdown
    event.stopPropagation();
  });

  // Hide the menu when something else is clicked
  $on(window, 'click', ({target}) => {
    hideElement(menu);
  });
}

/**
 * @param {Object} handlers - Object containing the following keys
 * settingsHandler - Called when the Page Settings menu item is clicked
 * debugHandler - Called when the Debug Info menu item is clicked.
 */
export function bindMenu({settingsHandler, debugHandler}) {
  $on(qs('#page-settings'), 'click', settingsHandler);
  $on(qs('#debug-info'), 'click', debugHandler);
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
  if (page.isError()) {
    setSubtitle('This page returned an error when scanned. ' +
      'Click the title above to see what\'s wrong.');
  } else if (page.newScanTime == null) {
    setSubtitle('This page has not yet been scanned.');
  } else {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This page was last scanned ${scanTime}. ` +
      'The changes are highlighted.');
  }
  setViewDropdown(ViewTypes.DIFF);
  loadSandboxedIframe(html);
}

/**
 * Show the old view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {string} html - Old HTML string.
 */
export function viewOld(page, html) {
  setTitle(page.title, page.url);
  if (page.oldScanTime === null) {
    setSubtitle('There is no old version of this page available yet.');
  } else {
    const scanTime = timeSince(new Date(page.oldScanTime));
    setSubtitle(`This is the old version of the page, scanned ${scanTime}.`);
  }
  setViewDropdown(ViewTypes.OLD);
  loadSandboxedIframe(html);
}

/**
 * Show the new view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {string} html - New HTML string.
 */
export function viewNew(page, html) {
  setTitle(page.title, page.url);
  if (page.newScanTime == null) {
    setSubtitle('This page has not yet been scanned.');
  } else {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This is the new version of the page, scanned ${scanTime}.`);
  }
  setViewDropdown(ViewTypes.NEW);
  loadSandboxedIframe(html);
}

/**
 * @param {string} title - Title of the page.
 * @param {string} url - URL of the page.
 */
function setTitle(title, url) {
  document.title = `Update Scanner - ${title}`;

  const titleElement = qs('#title');
  titleElement.textContent = title;
  titleElement.href = url;
}

/**
 * @param {string} subtitle - Subtitle text to use below the main title (eg
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
 * Create a sandboxed iframe with the supplied unsafe HTML and insert it into
 * the main content area.
 *
 * @param {string} html - Unsafe HTML to load.
 */
function loadSandboxedIframe(html) {
  removeIframe();
  const iframe = document.createElement('iframe');
  iframe.id = 'frame';
  iframe.classList.add('frame');
  iframe.sandbox = 'allow-top-navigation';
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
