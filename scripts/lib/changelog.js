const fs = require('fs');

exports.versionExists = function(version) {
  const changelog = fs.readFileSync('CHANGELOG.md', {encoding: 'utf-8'});

  for (const line of changelog.split('\n')) {
    if (line == `## ${version}`) {
      return true;
    }
  }
  return false;
};

exports.getChangeText = function(version) {
  const changelog = fs.readFileSync('CHANGELOG.md', {encoding: 'utf-8'});

  let emitting = false;
  let changeText = '';

  for (const line of changelog.split('\n')) {
    if (emitting && line.startsWith('##')) {
      return changeText;
    }

    if (emitting) {
      changeText += line + '\n';
    }

    if (line == `## ${version}`) {
      emitting = true;
    }
  }

  if (changeText == '') {
    throw Error(`CHANGELOG.md doesn't contain ${version}`);
  }
  return changeText;
};
