const fs = require('fs');
const UPDATES_FILE = 'updates.json';

/**
 * @returns {Object} Contents of the updates file.
 */
function readUpdates() {
  return require(`../../${UPDATES_FILE}`);
}

/**
 * @param {Object} updates - Contents of the updates file.
 */
function writeUpdates(updates) {
  fs.writeFileSync(UPDATES_FILE, JSON.stringify(updates, null, 2));
}

exports.addVersion = function(newVersion, strictMinVersion, addonId) {
  const updates = readUpdates();

  console.log(`Adding ${newVersion} to updates.json...`);

  const newUpdate = {
    version: newVersion,
    update_link: `https://github.com/sneakypete81/updatescanner/releases/download/${newVersion}/update_scanner-${newVersion}-an.fx.xpi`,
    applications: {gecko: {strict_min_version: strictMinVersion}},
  };

  updates.addons[addonId].updates.unshift(newUpdate);
  writeUpdates(updates);
};
