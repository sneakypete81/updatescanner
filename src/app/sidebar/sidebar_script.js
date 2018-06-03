import {Sidebar} from '/lib/sidebar/sidebar.js';

(function() {
  const sidebar = new Sidebar();
  document.addEventListener('DOMContentLoaded', () => sidebar.init());
})();
