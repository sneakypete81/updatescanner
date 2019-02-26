const github = require('./lib/github');
const manifestPatcher = require('./lib/manifest-patcher');
const changelog = require('./lib/changelog');

const release = async function() {
  const version = manifestPatcher.get('version');
  const isBeta = version.includes('beta');
  const changeText = changelog.getChangeText(version);

  await github.release(version, changeText, isBeta);
  await github.updateBetaIssue(version, changeText);
};

release();
