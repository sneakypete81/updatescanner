import {Settings} from 'settings/settings';

(function() {
  const settings = new Settings();
  document.addEventListener('DOMContentLoaded', () => settings.init());
})();
