/**
 * Wrap setTimeout in a Promise.
 *
 * @param {integer} delayMs - Number of milliseconds to delay.
 *
 * @returns {Promise} Promise that resolves after the specified delay.
 */
export function waitForMs(delayMs) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}


/**
 * From https://github.com/jahredhope/promise-file-reader.
 *
 * @param {string} file - File to read.
 * @param {string} as - Format to read into (DataURL, Text or ArrayBuffer).
 *
 * @returns {Promise} Promise that resolves to the file contents.
 */
function readAs(file, as) {
  if (!(file instanceof Blob)) {
    throw new TypeError('Must be a File or Blob');
  }
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result);
    };
    reader.onerror = function(e) {
      reject(new Error('Error reading' + file.name + ': ' + e.target.result));
    };
    reader['readAs' + as](file);
  });
}

/**
 * @param {string} file - File to read.
 * @returns {Promise} Promise that resolves to a DataURL of the file contents.
 */
export function readAsDataURL(file) {
  return readAs(file, 'DataURL');
}

/**
 * Read a file asynchronously, returning a Promise that resolves to a string.
 *
 * @param {string} file - File to read.
 * @returns {Promise} Promise that resolves to a string of the file's contents.
 */
export function readAsText(file) {
  return readAs(file, 'Text');
}

/**
 * @param {string} file - File to read.
 *
 * @returns {Promise} Promise that resolves to an ArrayBuffer of the file's
 * contents.
 */
export function readAsArrayBuffer(file) {
  return readAs(file, 'ArrayBuffer');
}
