const github = require('./lib/github');
const manifestPatcher = require('./lib/manifest-patcher');
const changelog = require('./lib/changelog');

const release = async function() {
  const version = manifestPatcher.get('version');
  const changeText = changelog.getChangeText(version);

  await github.release(version, changeText);
  await github.updateBetaIssue(version, changeText);
};

release();
