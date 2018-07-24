require('./clean');
require('./copy-dependencies');

const fs = require('fs');
const MANIFEST_FILE = 'src/manifest.json';
const UPDATE_URL = 'https://raw.githubusercontent.com/sneakypete81/updatescanner/master/updates.json';

// Update the manifest file to include an update_url for self-hosting.
const manifest = require(`../${MANIFEST_FILE}`);

if (!manifest.version.includes('beta')) {
  throw Error('Only beta versions can be self-hosted');
}

console.log('Adding update_url to manifest...');

manifest.applications.gecko.update_url = UPDATE_URL;
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

require('./web-ext.js').build().then(() => {

  console.log('Removing update_url from manifest...');

  delete manifest.applications.gecko.update_url;
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
});
