import {Popup} from '/lib/popup/popup.js';

(function() {
  const popup = new Popup();
  document.addEventListener('DOMContentLoaded', () => popup.init());
})();
