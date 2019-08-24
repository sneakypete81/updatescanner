import {type} from './type.js';

export const status = {
  NO_CHANGE: 'no_change',
  CHANGED: 'changed',
  ERROR: 'error',
};

const defaultPage = {
  title: 'New Page',
  url: null,
  scanRateMinutes: 24 * 60,
  changeThreshold: 100,
  ignoreNumbers: false,
  encoding: null,
  highlightChanges: true,
  highlightColour: '#ffff66',
  markChanges: false,
  doPost: false,
  postParams: null,
  status: status.NO_CHANGE,
  lastAutoscanTime: null,
  oldScanTime: null,
  newScanTime: null,
};

/**
 * Validate a page object by removing illegal properties and adding
 * defaults for missing properties.
 *
 * @param {object} page - Page object to validate.
 * @returns {object} Validated page object.
 */
export function validatePageWithDefaults(page) {
  return {...defaultPage, ...validatePage(page), type: type.PAGE};
}

/**
 * Validate a page object by removing illegal properties.
 *
 * @param {object} page - Page object to validate.
 * @returns {object} Validated page object.
 */
export function validatePage(page) {
  const filteredEntries = Object.entries(page).filter(
    (entry) => Object.keys(defaultPage).includes(entry[0]));

  return Object.fromEntries(filteredEntries);
}
