const buildSettingsFile = '.build_settings.json';

let buildSettings = {};
try {
  buildSettings = require(`../../${buildSettingsFile}`);
} catch (e) {
  console.warn(`Couldn't load build_setttings.json (${e})`);
  console.warn('Using default settings instead.');
}

exports.get = function(setting, defaultValue) {
  if (buildSettings.hasOwnProperty(setting)) {
    return buildSettings[setting];
  } else if (defaultValue !== undefined) {
    return defaultValue;
  } else {
    throw new Error(`${setting} is not set in ${buildSettingsFile}`);
  }
};
