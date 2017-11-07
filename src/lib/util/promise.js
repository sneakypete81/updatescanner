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
