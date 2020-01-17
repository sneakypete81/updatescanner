import {qs, $on, hideElement} from '/lib/util/view_helpers.js';

// See https://bugzilla.mozilla.org/show_bug.cgi?id=840640
import dialogPolyfill
  from '/dependencies/module/dialog-polyfill/dist/dialog-polyfill.esm.js';
import {Page} from '../page/page.js';

/**
 * Initialise the dialog box.
 */
export function init() {
  const dialog = qs('#settings-dialog');
  dialogPolyfill.registerDialog(dialog);

  const form = qs('#settings-form');
  form.elements['autoscan'].max = AutoscanSliderToMins.length - 1;
  form.elements['threshold'].max = ThresholdSliderToChars.length - 1;

  $on(form.elements['autoscan'], 'input', ({target}) =>
    updateAutoscanDescription(target.value),
  );
  $on(form.elements['threshold'], 'input', ({target}) =>
    updateThresholdDescription(target.value),
  );
  $on(form.elements['scan-mode'], 'input', ({target}) =>
    updateScanMode(target.value),
  );

  $on(form, 'reset', () => dialog.close());
}

/**
 * Show the settings dialog for the specified Page.
 *
 * @param {Page} page - Page object to view.
 *
 * @returns {Promise} Promise that resolves with an object containing the
 * updated page settings.
 */
export function openPageDialog(page) {
  const dialog = qs('#settings-dialog');
  const form = qs('#settings-form');
  qs('#heading').textContent = 'Page Settings';

  initializeSinglePageInput(form, page);
  const changeObject = {};
  initializeMultiPageInput(form, page, changeObject, false);

  dialog.showModal();

  return new Promise((resolve, reject) => {
    $on(dialog, 'close', () => {
      if (dialog.returnValue === 'ok') {
        const result = {};
        getSinglePageInputResult(form, result);
        getMultiPageInputResult(changeObject, result);
        resolve(result);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Show the settings dialog for the specified PageFolder.
 *
 * @param {PageNode} pageFolder - PageFolder object to view.
 *
 * @returns {Promise} Promise that resolves with an object containing the
 * updated pageFolder settings.
 */
export function openPageFolderDialog(pageFolder) {
  const dialog = qs('#settings-dialog');
  const form = qs('#settings-form');
  qs('#heading').textContent = 'Folder Settings';

  initializeFolderPageInput(form, pageFolder.page);

  const multipleInit = getDataFromMultiple(pageFolder.descendants);

  const changeObject = {};
  initializeMultiPageInput(form, multipleInit, changeObject, false);

  hideElement(qs('#urlFieldset'));

  dialog.showModal();

  return new Promise((resolve, reject) => {
    $on(dialog, 'close', () => {
      if (dialog.returnValue === 'ok') {
        const result = {};
        getFolderPageInputResult(form, result);
        getMultiPageInputResult(changeObject, result);
        resolve(result);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Show the settings dialog for the specified PageFolder.
 *
 * @param {Array<PageNode>} pageNodeArray - Array containing selected pages.
 *
 * @returns {Promise} Promise that resolves with an object containing the
 * updated pageFolder settings.
 */
export function openMultipleDialog(pageNodeArray) {
  const dialog = qs('#settings-dialog');
  const form = qs('#settings-form');

  qs('#heading').textContent = 'Multi-page Settings';

  const pageArray = pageNodeArray.flatMap((node) =>
    node.isFolder ? node.descendants : node.page);
  const condensed = getDataFromMultiple(pageArray);

  const changeObject = {};
  initializeMultiPageInput(form, condensed, changeObject, true);

  hideElement(qs('#urlFieldset'));
  hideElement(qs('#titleFieldset'));

  dialog.showModal();

  return new Promise((resolve, reject) => {
    $on(dialog, 'close', () => {
      if (dialog.returnValue === 'ok') {
        const result = {};
        getMultiPageInputResult(changeObject, result);
        resolve(result);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Initialize input for folder.
 *
 * @param {HTMLFormElement} form - Form element.
 * @param {{title: string}} initial - Initial data.
 */
function initializeFolderPageInput(form, initial) {
  form.elements['title'].value = initial.title;
}

/**
 * Writes page input data to result object.
 *
 * @param {HTMLFormElement} form - Form element.
 * @param {object} result - Object to which result data should be written.
 *
 */
function getFolderPageInputResult(form, result) {
  result.title = form.elements['title'].value;
}

/**
 * Initialize input for single page.
 *
 * @param {HTMLFormElement} form - Form element.
 * @param {{title: string, url: string}} initial - Initial data.
 */
function initializeSinglePageInput(form, initial) {
  form.elements['title'].value = initial.title;
  form.elements['url'].value = initial.url;
}

/**
 * Writes page input data to result object.
 *
 * @param {HTMLFormElement} form - Form element.
 * @param {object} result - Object to which result data should be written.
 *
 */
function getSinglePageInputResult(form, result) {
  result.title = form.elements['title'].value;
  result.url = form.elements['url'].value;
}

/**
 * Initializes multi page input and writes any changes immediately to result.
 * Every property that does not have null value has been changed.
 *
 * @param {HTMLFormElement} form - Form element.
 * @param {object} initial - Initial data.
 * @param {object} changeObject - Object to which changes are written.
 * @param {boolean} allowIndeterminate - Should inputs be indeterminate if null.
 */
function initializeMultiPageInput(
  form,
  initial,
  changeObject,
  allowIndeterminate,
) {
  console.log(initial);
  initializeAndListenOnChanges(
    form.elements['selectors'],
    'value',
    initial.selectors,
    changeObject,
    'selectors',
    allowIndeterminate,
  );

  initializeAndListenOnChanges(
    form.elements['scan-mode'],
    'value',
    initial.scanMode,
    changeObject,
    'scanMode',
    allowIndeterminate,
  );
  updateScanMode(initial.scanMode);

  const autoscanSliderValue = autoscanMinsToSlider(initial.scanRateMinutes);
  initializeAndListenOnChanges(
    form.elements['autoscan'],
    'value',
    autoscanSliderValue,
    changeObject,
    'autoscanSliderValue',
    allowIndeterminate,
  );
  updateAutoscanDescription(autoscanSliderValue);
  if (initial.scanRateMinutes == null && allowIndeterminate) {
    form.elements['autoscan-description'].value = 'Various';
  }

  const thresholdSliderValue =
    thresholdCharsToSlider(initial.changeThreshold);
  updateThresholdDescription(thresholdSliderValue);
  initializeAndListenOnChanges(
    form.elements['threshold'],
    'value',
    thresholdSliderValue,
    changeObject,
    'thresholdSliderValue',
    allowIndeterminate,
  );
  if (initial.changeThreshold == null && allowIndeterminate) {
    form.elements['threshold-description'].value = 'Various';
  }

  initializeAndListenOnChanges(
    form.elements['ignore-numbers'],
    'checked',
    initial.ignoreNumbers,
    changeObject,
    'ignoreNumbers',
    allowIndeterminate,
  );
}

/**
 * Writes page input data to result object.
 *
 * @param {object} changeObject - Change object passed to initialization
 *   function.
 * @param {object} result - Object to which result data should be written.
 *
 */
function getMultiPageInputResult(changeObject, result) {
  const mode = result.scanMode;
  const modeData = mode == null ? {} : ScanModeMap.get(mode).options;
  result.scanRateMinutes =
    AutoscanSliderToMins[changeObject.autoscanSliderValue];
  result.changeThreshold =
    ThresholdSliderToChars[changeObject.thresholdSliderValue];
  result.ignoreNumbers = changeObject.ignoreNumbers;
  result.selectors = changeObject.selectors;
  result.contentMode = modeData.contentMode;
  result.matchMode = modeData.matchMode;
  result.requireExactMatchCount = modeData.requireExactMatchCount;
  result.partialScan = modeData.partialScan;
}

/**
 *
 * @param {Element} element - Element.
 * @param {string} elementPropertyName - Element property (eg. Value, checked).
 * @param {?string|number|boolean} initialValue - Initial value.
 * @param {object} config - Configuration object used to save new value.
 * @param {string} propertyName - Configuration property name.
 * @param {boolean} allowIndeterminate - Should inputs be indeterminate if null.
 */
function initializeAndListenOnChanges(
  element,
  elementPropertyName,
  initialValue,
  config,
  propertyName,
  allowIndeterminate,
) {
  element[elementPropertyName] = initialValue;
  if (initialValue == null && allowIndeterminate) {
    element.indeterminate = true;
    element.placeholder = 'Various';
  }
  element.addEventListener(
    'input',
    () => {
      if (initialValue == null) {
        element.placeholder = '';
      }
      config[propertyName] = element[elementPropertyName];
    },
  );
}

/**
 * Returns common page data from multiple pages.
 *
 * @param {Array<Page>} pageArray - Page array.
 * @returns {{scanMode: string, selectors: string,ignoreNumbers: boolean,
 *   changeThreshold: number,scanRateMinutes: number}} Object containing
 *   generalized values for all items in array.
 */
function getDataFromMultiple(pageArray) {
  const first = pageArray[0];
  const result = {
    scanMode: getScanModeName(first),
    selectors: first.selectors,
    ignoreNumbers: first.ignoreNumbers,
    changeThreshold: first.changeThreshold,
    scanRateMinutes: first.scanRateMinutes,
  };

  for (let i = 1; i < pageArray.length; i++) {
    const page = pageArray[i];
    if (page.selectors !== result.selectors) {
      result.selectors = null;
    }

    const scanMode = getScanModeName(page);
    if (result.scanMode !== scanMode) {
      result.scanMode = null;
    }

    if (result.ignoreNumbers !== page.ignoreNumbers) {
      result.ignoreNumbers = null;
    }

    if (result.changeThreshold !== page.changeThreshold) {
      result.changeThreshold = null;
    }

    if (result.scanRateMinutes !== page.scanRateMinutes) {
      result.scanRateMinutes = null;
    }
  }

  return result;
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
 * @param {number} minutes - Number of minutes between scans.
 *
 * @returns {number} Slider value representing the given number of minutes.
 */
function autoscanMinsToSlider(minutes) {
  if (minutes === 0) {
    return AutoscanSliderNever;
  }

  // Walk through the options, returning the first one that matches
  for (let i = 0; i < AutoscanSliderToMins.length; i++) {
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
 * @param {number} sliderValue - Autoscan slider value.
 */
function updateAutoscanDescription(sliderValue) {
  qs('#settings-form').elements['autoscan-description'].value =
    AutoscanSliderDescriptions[sliderValue];
}

const ScanModeMap = new Map([
  ['anywhere', {
    description: '',
    options: {
      partialScan: false,
      contentMode: Page.contentModeEnum.TEXT,
      matchMode: Page.matchModeEnum.FIRST,
    },
  }],
  ['inside-elements', {
    description: `Check only inside selected elements using HTML elements 
    selector.`,
    options: {
      partialScan: true,
      requireExactMatchCount: true,
      contentMode: Page.contentModeEnum.TEXT,
      matchMode: Page.matchModeEnum.FIRST,
    },
  }],
  ['count-only', {
    description: `Check only for change in number of HTML element matches.
    Content is ignored.`,
    options: {
      partialScan: true,
      requireExactMatchCount: true,
      contentMode: Page.contentModeEnum.IGNORE,
      matchMode: Page.matchModeEnum.FIRST,
    },
  }],
]);

/**
 * Returns description for selectors input field.
 *
 * @param {boolean} partialScan - True if partial scan is active.
 * @returns {string} Description for selectors.
 */
function getSelectorsDescription(partialScan) {
  if (partialScan) {
    return `CSS selectors for more information see 
<a href="https://www.w3schools.com/cssref/css_selectors.asp">
https://www.w3schools.com/cssref/css_selectors.asp</a>`;
  } else {
    return `Selectors not available in "Anywhere" scan mode.`;
  }
}

/**
 * Replaces innerHTML for element without directly assigning it to innerHTML.
 *
 * @param {Element} element - HTML element.
 * @param {string} html - Raw HTML.
 */
function replaceInnerHTML(element, html) {
  html = '<span>' + html + '</span>';
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  const content = parsed.getElementsByTagName('span')[0];

  element.innerHTML = '';
  element.appendChild(content);
}

/**
 *  Updates scan mode description, threshold state and other related inputs.
 *
 * @param {?string} modeName - Scan mode name.
 */
function updateScanMode(modeName) {
  if (modeName == null) {
    setCustomScanMode();
  } else {
    const form = qs('#settings-form');
    const mode = ScanModeMap.get(modeName);
    const descriptionElement = form.elements['scan-mode-description'];
    descriptionElement.value = mode.description;

    const partialScan = mode.options.partialScan;
    const selectorDescription = getSelectorsDescription(partialScan);
    replaceInnerHTML(
      form.elements['selectors-description'],
      selectorDescription,
    );
    setDisableOnInput(form.elements['selectors'], !partialScan);

    updateThresholdDisabledState(mode.options);
  }
}

/**
 * Sets scan mode to various, meaning it differs for multiple items.
 */
function setCustomScanMode() {
  const form = qs('#settings-form');
  const descriptionElement = form.elements['scan-mode-description'];
  descriptionElement.value = 'Custom';

  const partialScan = true;
  const selectorDescription = getSelectorsDescription(partialScan);
  replaceInnerHTML(form.elements['selectors-description'], selectorDescription);
  setDisableOnInput(form.elements['selectors'], !partialScan);

  updateThresholdDisabledState({contentMode: Page.contentModeEnum.TEXT});
}

/**
 * Sets disabled on input or wrapper and all it's input children.
 *
 * @param {Element} parent - Parent element.
 * @param {boolean} disabled - True if input should be disabled.
 */
function setDisableOnInput(parent, disabled) {
  if (parent.tagName === 'INPUT') {
    parent.disabled = disabled;
  } else {
    const disabledClass = 'disabled';
    const hasRightClass =
      parent.classList.contains(disabledClass) === disabled;

    if (!hasRightClass) {
      if (disabled) {
        parent.classList.add(disabledClass);
      } else {
        parent.classList.remove(disabledClass);
      }
    }

    parent.querySelectorAll('input, select').forEach((node) => {
      node.disabled = disabled;
    });
  }
}

/**
 * Updates disabled state for threshold input.
 *
 * @param {object} modeOptions - Mode options.
 */
function updateThresholdDisabledState(modeOptions) {
  const thresholdFieldset = qs('#thresholdFieldset');
  thresholdFieldset.classList.remove('disabled');
  if (modeOptions.contentMode === Page.contentModeEnum.IGNORE) {
    setDisableOnInput(thresholdFieldset, true);
  } else {
    setDisableOnInput(thresholdFieldset, false);
  }
}


/**
 * Returns scan mode from page.
 *
 * @param {Page} page - Page.
 * @returns {string} Mode name.
 */
function getScanModeName(page) {
  const scanModeMapIterator = ScanModeMap.entries();
  for (const item of scanModeMapIterator) {
    const data = item[1];
    const options = data.options;
    let isEqual = true;
    for (const propertyName in options) {
      if (options[propertyName] !== page[propertyName]) {
        isEqual = false;
        break;
      }
    }

    if (isEqual) {
      return item[0];
    }
  }

  return ScanModeMap.keys().next().value;
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
 * @param {number} changeThreshold - Change threshold measured in characters.
 *
 * @returns {number} Slider value representing the given number of characters.
 */
function thresholdCharsToSlider(changeThreshold) {
  // Walk through the options, returning the first one that matches
  for (let i = 0; i < ThresholdSliderToChars.length; i++) {
    if (ThresholdSliderToChars[i] >= changeThreshold) {
      return i;
    }
  }
  return thresholdCharsToSlider.length - 1;
}

/**
 * Update the Threshold description text based on the current slider value.
 *
 * @param {number} sliderValue - Threshold slider value.
 */
function updateThresholdDescription(sliderValue) {
  qs('#settings-form').elements['threshold-description'].value =
    ThresholdSliderDescriptions[sliderValue][0];
  qs('#settings-form').elements['threshold-subdescription'].value =
    ThresholdSliderDescriptions[sliderValue][1];
}
