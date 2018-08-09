import {DebugInfo} from '/lib/debug_info/debug_info.js';

(function() {
  const debugInfo = new DebugInfo();
  document.addEventListener('DOMContentLoaded', () => debugInfo.init());
})();
