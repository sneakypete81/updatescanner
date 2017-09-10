import {Upgrade} from 'upgrade/upgrade';

(function() {
  const upgrade = new Upgrade();
  document.addEventListener('DOMContentLoaded', () => upgrade.init());
})();
