require('./clean');
require('./copy-dependencies');

const manifestPatcher = require('./manifest-patcher.js');
const settings = require('./settings');

const sign = async function() {
  // Update the manifest file to include an update_url for self-hosting.
  manifestPatcher.patch();

  try {
    await require('./web-ext.js').sign(
      settings.get('api_key'),
      settings.get('api_secret')
    );
  } finally {
    manifestPatcher.unPatch();
  }
};

sign();
