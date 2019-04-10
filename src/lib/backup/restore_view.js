import {$on, qs, showElement, hideElement} from '/lib/util/view_helpers.js';

/**
 * @param {Function} clickHandler - Called when the Upload button is clicked.
 */
export function showUploadButton(clickHandler) {
  showElement(qs('#uploading'));

  $on(qs('#upload-button'), 'click', clickHandler);
}

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
  hideElement(qs('#uploading'));
  hideElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

/**
 * Display the "Restore Complete" message.
 */
export function showComplete() {
  hideElement(qs('#restoring'));
  hideElement(qs('#uploading'));
  showElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

/**
 * Display the "Restore Failed" message.
 */
export function showFailed() {
  hideElement(qs('#restoring'));
  hideElement(qs('#uploading'));
  hideElement(qs('#restore-complete'));
  showElement(qs('#restore-failed'));
}
