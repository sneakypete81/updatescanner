import {qs, showElement, hideElement} from '/lib/util/view_helpers.js';

/**
 * Display the "Updating" progress message.
 */
export function showUpdating() {
  showElement(qs('#updating'));
  hideElement(qs('#update-complete'));
  hideElement(qs('#update-failed'));
}

/**
 * Display the "Update Complete" message.
 */
export function showComplete() {
  hideElement(qs('#updating'));
  showElement(qs('#update-complete'));
  hideElement(qs('#update-failed'));
}

/**
 * Display the "Update Failed" message.
 */
export function showFailed() {
  hideElement(qs('#updating'));
  hideElement(qs('#update-complete'));
  showElement(qs('#update-failed'));
}
