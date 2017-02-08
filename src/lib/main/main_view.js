import {qs, $on} from 'util/view_helpers';
import {timeSince} from 'util/date_format';

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
 * Show the diff view of the specified page.
 *
 * @param {Page} page - Page object to view.
 * @param {tring} diffHtml - HTML string with diff highlighting.
 */
export function viewDiff(page, diffHtml) {
  setTitle(page.title, page.url);
  if (page.newScanTime !== undefined) {
    const scanTime = timeSince(new Date(page.newScanTime));
    setSubtitle(`This page was last scanned ${scanTime}. ` +
      'The changes are highlighted.');
  }
  loadIframe(diffHtml);
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
