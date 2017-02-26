import {qs, $on} from 'util/view_helpers';

/**
 * Initialise the Page Settings view.
 */
export function init() {
  const form = qs('#form');
  form.autoscan.max = AutoscanSliderToMins.length - 1;
  form.threshold.max = ThresholdSliderToChars.length - 1;

  $on(form.autoscan, 'input', ({target}) =>
    updateAutoscanDescription(target.value));
  $on(form.threshold, 'input', ({target}) =>
    updateThresholdDescription(target.value));
}

/**
 * @param {Function} handler - Called when a dialog input is modified.
 */
export function bindValueInput(handler) {
  const form = qs('#form');
  $on(form.title, 'input', ({target}) => handler('title', target.value));
  $on(form.url, 'input', ({target}) => handler('url', target.value));
  $on(form.autoscan, 'input', ({target}) =>
    handler('scanRateMinutes', AutoscanSliderToMins[target.value]));
  $on(form.threshold, 'input', ({target}) =>
    handler('changeThreshold', ThresholdSliderToChars[target.value]));
}
/**
 * Update the Page Settings view.
 *
 * @param {Object} data - Object containing the data to update the view. All
 * attributes are optional, only those that exist will be used.
 * @param {string} data.title - Title of the page.
 * @param {string} data.url - URL of the page.
 * @param {integer} data.scanRateMinutes - Number of minutes between scans. Zero
 * means manual scan only.
 * @param {integer} data.changeThreshold - Number of characters changed before
 * signalling that a change has occurred.
 */
export function update({title, url, scanRateMinutes, changeThreshold}) {
  const form = qs('#form');

  if (title !== null) {
    form.title.value = title;
  }
  if (url !== null) {
    form.url.value = url;
  }
  if (scanRateMinutes !== null) {
    form.autoscan.value = autoscanMinsToSlider(scanRateMinutes);
    updateAutoscanDescription(form.autoscan.value);
  }
  if (changeThreshold !== null) {
    form.threshold.value = thresholdCharsToSlider(changeThreshold);
    updateThresholdDescription(form.threshold.value);
  }
}

const AutoscanSliderMap = new Map([
  [5, 'Scan every 5 minutes'],
  [15, 'Scan every 15 minutes'],
  [30, 'Scan every 30 minutes'],
  [60, 'Scan every hour'],
  [6 * 60, 'Scan every 6 hours'],
  [24 * 60, 'Scan every day'],
  [7 * 24 * 60, 'Scan every week'],
  [0, 'Manual scan only'],
]);
const AutoscanSliderToMins = [...AutoscanSliderMap.keys()];
const AutoscanSliderDescriptions = [...AutoscanSliderMap.values()];
const AutoscanSliderNever = AutoscanSliderToMins.indexOf(0);

/**
 * @param {integer} minutes - Number of minutes between scans.
 *
 * @returns {integer} Slider value representing the given number of minutes.
 */
function autoscanMinsToSlider(minutes) {
  if (minutes == 0) {
    return AutoscanSliderNever;
  }

  // Walk through the options, returning the first one that matches
  for (let i=0; i<AutoscanSliderToMins.length; i++) {
    if (AutoscanSliderToMins[i] >= minutes) {
      return i;
    }
  }

  // Round down to 7 weeks
  return AutoscanSliderNever - 1;
}

/**
 * Update the Autoscan description text based on the current slider value.
 *
 * @param {integer} sliderValue - Autoscan slider value.
 */
function updateAutoscanDescription(sliderValue) {
  qs('#form').elements['autoscan-description'].value =
    AutoscanSliderDescriptions[sliderValue];
}

const ThresholdSliderMap = new Map([
  [0, ['All changes are detected', '']],
  [10, ['Cosmetic changes are ignored', '(less than about 10 characters)']],
  [50, ['Minor changes are ignored', '(less than about 50 characters)']],
  [100, ['Small changes are ignored', '(less than about 100 characters)']],
  [500, ['Medium changes are ignored', '(less than about 500 characters)']],
  [1000, ['Major changes are ignored', '(less than about 1000 characters)']],
]);
const ThresholdSliderToChars = [...ThresholdSliderMap.keys()];
const ThresholdSliderDescriptions = [...ThresholdSliderMap.values()];

/**
 * @param {integer} changeThreshold - Change threshold measured in characters.
 *
 * @returns {integer} Slider value representing the given number of characters.
 */
function thresholdCharsToSlider(changeThreshold) {
  // Walk through the options, returning the first one that matches
  for (let i=0; i<ThresholdSliderToChars.length; i++) {
    if (ThresholdSliderToChars[i] >= changeThreshold) {
      return i;
    }
  }
  return thresholdCharsToSlider.length - 1;
}

/**
 * Update the Threshold description text based on the current slider value.
 *
 * @param {integer} sliderValue - Threshold slider value.
 */
function updateThresholdDescription(sliderValue) {
  qs('#form').elements['threshold-description'].value =
    ThresholdSliderDescriptions[sliderValue][0];
  qs('#form').elements['threshold-subdescription'].value =
    ThresholdSliderDescriptions[sliderValue][1];
}
