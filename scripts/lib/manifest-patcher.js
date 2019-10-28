const fs = require('fs');
const MANIFEST_FILE = 'src/manifest.json';
const UPDATE_URL = 'https://raw.githubusercontent.com/sneakypete81/updatescanner/master/updates.json';

/**
 * @returns {object} Contents of the manifest file.
 */
function readManifest() {
  return require(`../../${MANIFEST_FILE}`);
}

/**
 * @param {object} manifest - Contents of the manifest file.
 */
function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

exports.patch = function() {
  const manifest = readManifest();
  const isPreRelease = ['alpha', 'beta'].some(
    (str) => manifest.version.includes(str),
  );

  if (!isPreRelease) {
    throw Error('Only alpha/beta versions can be self-hosted');
  }

  console.log('Adding update_url to manifest...');

  manifest.browser_specific_settings.gecko.update_url = UPDATE_URL;
  writeManifest(manifest);
};

exports.unPatch = function() {
  const manifest = readManifest();

  console.log('Removing update_url from manifest...');

  delete manifest.browser_specific_settings.gecko.update_url;
  writeManifest(manifest);
};

exports.get = function(property) {
  return readManifest()[property];
};

exports.set = function(property, value) {
  const manifest = readManifest();

  console.log(`Updating manifest ${property} to ${value}...`);

  manifest[property] = value;
  writeManifest(manifest);
};
