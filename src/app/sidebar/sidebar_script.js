import {Sidebar} from 'sidebar/sidebar';

(function() {
  const sidebar = new Sidebar();
  document.addEventListener('DOMContentLoaded', () => sidebar.init());
})();
