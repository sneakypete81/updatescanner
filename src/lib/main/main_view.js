import {getSettingsUrl} from 'settings/settings_url';
import {qs, $on} from 'util/view_helpers';
import {timeSince} from 'util/date_format';

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
  initDialog();
}

/**
 * Initialise the dropdown menu.
 */
function initMenu() {
  const menu = qs('#menu');

  // Toggle the menu when its button is clicked
  $on(qs('#menuButton'), 'click', (event) => {
    menu.classList.toggle('show');
    // Prevent the click from immediately closing the dropdown
    event.stopPropagation();
  });

  // Hide the menu when something else is clicked
  $on(window, 'click', ({target}) => {
    if (menu.classList.contains('show')) {
      menu.classList.remove('show');
    }
  });
}

/**
 * Initialise the dialog box.
 */
function initDialog() {
  const dialog = qs('#dialog');
  const dialogFrame = qs('#dialog-frame');

  // Show the dialog once its content has loaded
  $on(dialogFrame, 'load', () => {
    dialog.classList.add('show');

    // Adjust the dialog iframe size to match the dialog contents
    dialogFrame.style.height =
      dialogFrame.contentWindow.document.body.offsetHeight + 'px';

    const borderWidth = 2;
    qs('#dialog-content').style.width =
      qs('#content', dialogFrame.contentWindow.document).offsetWidth +
      borderWidth + 'px';

    // Hide the dialog when its close button is clicked
    $on(qs('#close', dialogFrame.contentWindow.document), 'click', (event) => {
      dialog.classList.remove('show');
      event.stopPropagation();
    });
  });

  // Hide dialog when something else is clicked
  $on(window, 'click', ({target}) => {
    if (dialog.classList.contains('show')) {
      dialog.classList.remove('show');
    }
  });
}

/**
 * @param {Object} handlers - Object containing the following keys:
 * settingsHandler - Called when the Page Settings menu item is clicked.
 */
export function bindMenu({settingsHandler}) {
  $on(qs('#page-settings'), 'click', (event) => {
    settingsHandler();
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
  if (page.newScanTime != null) {
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
  if (page.oldScanTime !== null) {
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
  if (page.newScanTime !== null) {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This is the new version of the page, scanned ${scanTime}.`);
  }
  setViewDropdown(ViewTypes.NEW);
  loadSandboxedIframe(html);
}

/**
 * Show the settings dialog for the specified page.
 *
 * @param {Page} page - Page object to view.
 */
export function openSettingsDialog(page) {
  qs('#dialog-frame').src = getSettingsUrl(page.id);
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
