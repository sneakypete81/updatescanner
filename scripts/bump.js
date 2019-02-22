const readline = require('readline');
const {execFileSync} = require('child_process');
const manifestPatcher = require('./lib/manifest-patcher');
const updatePatcher = require('./lib/update-patcher');
const changelog = require('./lib/changelog');

/**
 * @returns {boolean} True if the Git workspace contains no modified files
 * (apart from CHANGELOG.md).
 */
function gitIsCleanExceptChangelog() {
  const stdout = execFileSync(
    'git', ['status', '--porcelain'],
    {encoding: 'utf8'});
  console.log(stdout);
  return (stdout == '' || stdout == ' M CHANGELOG.md\n');
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

if (!gitIsCleanExceptChangelog()) {
  throw Error('Git workspace must be clean (except CHANGELOG.md)');
}

const oldVersion = manifestPatcher.get('version');
console.log(`Current version: ${oldVersion}`);

rl.question('New version: ', (newVersion) => {
  rl.close();

  if (!changelog.versionExists(newVersion)) {
    throw Error(`No CHANGELOG.md entry for ${newVersion}`);
  }

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
