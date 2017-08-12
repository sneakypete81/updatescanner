let buildSettings = {};
try {
  buildSettings = require('../.build_settings.json');
} catch(e) {
  console.warn(`Couldn't load build_setttings.json (${e})`);
  console.warn('Using default settings instead.');
}

module.exports = {
  get: function(setting, defaultValue) {
    if (buildSettings.hasOwnProperty(setting)) {
      return buildSettings[setting];
    } else {
      return defaultValue;
    }
  },
};
