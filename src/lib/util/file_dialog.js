/**
 * Directly call the file browser dialog from your code, and get back the
 * resulting array of FileList.
 *
 * Adapted from https://www.npmjs.com/package/file-dialog v0.0.7 (MIT license).
 *
 * @param {Object} args - Object with the following options
 *          {bool} multiple - Allow multiple files to be selected
 *          {string} accept - File extensions to accept.
 * @returns {Promise} Promise that resolves with the list of uploaded files.
 */
export function fileDialog({multiple, accept}) {
  const input = document.createElement('input');

  // Set config
  if (multiple === true) {
    input.setAttribute('multiple', '');
  }
  if (accept !== undefined) {
    input.setAttribute('accept', accept);
  }
  input.setAttribute('type', 'file');

  // Return promise/callvack
  return new Promise((resolve, reject) => {
    input.addEventListener('change', (e) => {
      resolve(input.files);
    });

    // Simluate click event
    input.click();
  });
}
