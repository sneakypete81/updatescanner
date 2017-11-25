import {qs, showElement, hideElement} from 'util/view_helpers';

/**
 * Show a dialog asking for confirmation before restoring pages.
 *
 * @returns {boolean} True if the user confirmed the restore.
 */
export function confirmRestore() {
  return window.confirm(
    'Restoring will overwrite your existing pages - are you sure?');
}

export function showRestoring() {
  showElement(qs('#restoring'));
  hideElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

export function showComplete() {
  hideElement(qs('#restoring'));
  showElement(qs('#restore-complete'));
  hideElement(qs('#restore-failed'));
}

export function showFailed() {
  hideElement(qs('#restoring'));
  hideElement(qs('#restore-complete'));
  showElement(qs('#restore-failed'));
}
