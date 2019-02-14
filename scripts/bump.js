const readline = require('readline');
const {execFileSync, spawnSync} = require('child_process');
const manifestPatcher = require('./manifest-patcher');
const updatePatcher = require('./update-patcher');

/**
 * @returns {boolean} True if the Git workspace contains no modified files.
 */
function gitIsClean() {
  const result = spawnSync('git', ['diff', 'HEAD', '--quiet']);
  return result.status == 0;
}

/**
 * Adds all modified files to the Git index.
 */
function gitAdd() {
  execFileSync('git', ['add', '.']);
}

/**
 * @param {string} message - Git commit message.
 */
function gitCommit(message) {
  execFileSync('git', ['commit', '-m', message]);
}

/**
 * @param {string} tag - Git tag.
 */
function gitTag(tag) {
  execFileSync('git', ['tag', tag]);
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!gitIsClean()) {
  throw Error('Git workspace contains modified files.');
}

const oldVersion = manifestPatcher.get('version');
console.log(`Current version: ${oldVersion}`);

rl.question('New version: ', (newVersion) => {
  rl.close();

  manifestPatcher.set('version', newVersion);

  if (newVersion.includes('beta')) {
    const appsProperties = manifestPatcher.get('applications');
    const strictMinVersion = appsProperties.gecko.strict_min_version;
    const addonId = appsProperties.gecko.id;
    updatePatcher.addVersion(newVersion, strictMinVersion, addonId);
  }

  console.log('Git add+commit+tag');
  gitAdd();
  gitCommit(`bump to ${newVersion}`);
  gitTag(newVersion);
});
