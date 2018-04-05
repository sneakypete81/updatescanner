// Patch the manifest file in the 'build' folder to include update_url.
// This is used to self-host beta releases.

const fs = require('fs');

const MANIFEST_FILE = 'build/manifest.json';
const UPDATE_URL = 'https://raw.githubusercontent.com/sneakypete81/updatescanner/master/updates.json';

module.exports = function patchManifest() {
  const manifest = require(`../${MANIFEST_FILE}`);

  if (!manifest.version.includes('beta')) {
    throw Error('Only beta versions can be self-hosted');
  }

  manifest.applications.gecko.update_url = UPDATE_URL;

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
};
