import {restore} from 'backup/restore';

(function() {
  if (document.URL.endsWith('restore.html')) {
    document.addEventListener('DOMContentLoaded', () => restore());
  }
  if (document.URL.endsWith('backup.html')) {
    // @TODO
  }
})();
