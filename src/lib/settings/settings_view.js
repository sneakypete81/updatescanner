import {qs} from 'util/view_helpers';

const AutoscanSliderToMins = [
  5,
  15,
  30,
  60,
  6 * 60,
  24 * 60,
  7 * 24 * 60,
  0, // Never
];
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

const ThresholdSliderToChars = [
  0,
  10,
  50,
  100,
  500,
  1000,
];

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
 * Initialise the Page Settings view.
 */
export function init() {
  const form = qs('#form');
  form.autoscan.max = AutoscanSliderToMins.length - 1;
  form.threshold.max = ThresholdSliderToChars.length - 1;
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

  if (title !== undefined) {
    form.title.value = title;
  }
  if (url !== undefined) {
    form.url.value = url;
  }
  if (scanRateMinutes !== undefined) {
    form.autoscan.value = autoscanMinsToSlider(scanRateMinutes);
  }
  if (changeThreshold !== undefined) {
    form.threshold.value = thresholdCharsToSlider(changeThreshold);
  }
}
