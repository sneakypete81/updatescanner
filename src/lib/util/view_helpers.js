// From https://github.com/tastejs/todomvc/tree/gh-pages/examples/vanilla-es6/src/helpers.js
//
// Everything in this file is MIT License unless otherwise specified.
//
// Copyright (c) Addy Osmani, Sindre Sorhus, Pascal Hartig, Stephen Sawchuk.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Wrapper for querySelector.
 *
 * @param {string} selector - Selector to query.
 * @param {Element} [scope] - Optional scope element for the selector.
 *
 * @returns {Element} Result of the querySelector operation.
 */
export function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

/**
 * Wrapper for addEventListener.
 *
 * @param {Element|Window} target - Target Element.
 * @param {string} type - Event name to bind to.
 * @param {Function} callback - Event callback.
 * @param {boolean} [capture] - Capture the event.
 */
export function $on(target, type, callback, capture) {
  target.addEventListener(type, callback, !!capture);
}

/**
 * Attach a handler to an event for all elements matching a selector.
 *
 * @param {Element} target - Element which the event must bubble to.
 * @param {string} selector - Selector to match.
 * @param {string} type - Event name.
 * @param {Function} handler - Function called when the event bubbles to target
 * from an element matching selector.
 * @param {boolean} [capture] - Capture the event.
 */
export function $delegate(target, selector, type, handler, capture) {
  const dispatchEvent = (event) => {
    const targetElement = event.target;
    const potentialElements = target.querySelectorAll(selector);
    let i = potentialElements.length;

    while (i--) {
      if (potentialElements[i] === targetElement) {
        handler.call(targetElement, event);
        break;
      }
    }
  };

  $on(target, type, dispatchEvent, !!capture);
}

/**
 * Search upwards from the specified element to find a parent with a particular
 * class.
 *
 * @param {Element} element - Element to start searching from.
 * @param {string} className - Parent class to match.
 *
 * @returns {Element} Parent element that matches the specified class, or null
 * if no such parent exists.
 */
export function findParentWithClass(element, className) {
  while (element !== null && element.className != className) {
    element = element.parentNode;
  }
  return element;
}

/**
 * Removes the 'hidden' class from the element.
 *
 * @param {Element} element - Element to show.
 */
export function showElement(element) {
  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
  }
}

/**
 * Adds the 'hidden' class from the element.
 *
 * @param {Element} element - Element to hide.
 */
export function hideElement(element) {
  if (!element.classList.contains('hidden')) {
    element.classList.add('hidden');
  }
}
