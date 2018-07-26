require('./clean');
require('./copy-dependencies');

const manifestPatcher = require('./manifest-patcher.js');

const build = async function() {
  // Update the manifest file to include an update_url for self-hosting.
  manifestPatcher.patch();

  try {
    await require('./web-ext.js').build();
  } finally {
    manifestPatcher.unPatch();
  }
};

build();
