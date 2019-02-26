const fs = require('fs');
const path = require('path');
const settings = require('./settings');

const Octokit = require('@octokit/rest');
const octokit = new Octokit({
  auth: 'token ' + settings.get('github_token'),
});

const OWNER = 'sneakypete81';
const REPO = 'updatescanner';
const BETA_ISSUE = 36;

exports.release = async function(version, changeText, isBeta) {
  console.log(`Creating Github release ${version}...`);

  const xpiPath = `dist/update_scanner-${version}-an.fx.xpi`;
  if (!fs.existsSync(xpiPath)) {
    throw Error(`${xpiPath} does not exist.`);
  }

  const releaseParams = {
    owner: OWNER,
    repo: REPO,
    tag_name: version,
    body: changeText,
    prerelease: isBeta,
  };
  const {
    data: {upload_url: uploadUrl},
  } = await octokit.repos.createRelease(releaseParams);

  if (version.includes('beta')) {
    uploadXpi(xpiPath, uploadUrl);
  }
};

const uploadXpi = async function(xpiPath, uploadUrl) {
  const filename = path.basename(xpiPath);
  console.log(`Uploading ${filename}...`);

  const uploadParams = {
    url: uploadUrl,
    file: fs.readFileSync(xpiPath),
    name: filename,
    headers: {
      'content-type': 'application/x-xpinstall',
      'content-length': fs.statSync(xpiPath).size,
    },
  };
  await octokit.repos.uploadReleaseAsset(uploadParams);
};

exports.updateBetaIssue = async function(version, changeText) {
  console.log('Updating Beta Issue...');
  const downloadUrl = `https://github.com/${OWNER}/${REPO}/releases/download/${version}/update_scanner-${version}-an.fx.xpi`;
  const commentParams = {
    owner: OWNER,
    repo: REPO,
    number: BETA_ISSUE,
    body: (
      `${version} is now available to install from ${downloadUrl}\n\n` +
      changeText
    ),
  };
  await octokit.issues.createComment(commentParams);
};
