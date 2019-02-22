require('./clean');
require('./copy-dependencies');

const manifestPatcher = require('./lib/manifest-patcher');
const settings = require('./lib/settings');
const renameSignedXpi = require('./lib/rename-signed-xpi');
const webExt = require('./lib/web-ext.js');

const sign = async function() {
  // Update the manifest file to include an update_url for self-hosting.
  manifestPatcher.patch();

  try {
    await webExt.sign(
      settings.get('api_key'),
      settings.get('api_secret')
    );
  } finally {
    manifestPatcher.unPatch();
    renameSignedXpi.rename();
  }
};

sign();
