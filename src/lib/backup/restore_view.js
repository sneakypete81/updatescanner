import {qs, showElement, hideElement} from '/lib/util/view_helpers.js';

/**
 * Show a dialog asking for confirmation before restoring pages.
 *
 * @returns {boolean} True if the user confirmed the restore.
 */
export function confirmRestore() {
  return window.confirm(
    'Restoring will overwrite your existing pages - are you sure?');
}

/**
 * Display the "Restoring" progress message.
 */
export function showRestoring() {
  showElement(qs('#restoring'));
  hideElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

/**
 * Display the "Restore Complete" message.
 */
export function showComplete() {
  hideElement(qs('#restoring'));
  showElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

/**
 * Display the "Restore Failed" message.
 */
export function showFailed() {
  hideElement(qs('#restoring'));
  hideElement(qs('#restore-complete'));
  showElement(qs('#restore-failed'));
}
