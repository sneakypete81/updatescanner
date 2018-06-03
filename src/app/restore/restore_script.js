import {restore} from '/lib/backup/restore.js';

(function() {
  document.addEventListener('DOMContentLoaded', () => restore());
})();
