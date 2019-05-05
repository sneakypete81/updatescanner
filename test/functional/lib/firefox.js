const rp = require('request-promise-native');

const BASE_URI = (
  browser.config.baseUrl + ':4444' + browser.config.path +
  'session/' + browser.sessionId
);

const CONTEXT_URI = BASE_URI + '/moz/context';
const ADDON_INSTALL_URI = BASE_URI + '/moz/addon/install';
const ADDON_UNINSTALL_URI = BASE_URI + '/moz/addon/uninstall';

module.exports.getContext = async function() {
  const result = await rp({
    uri: CONTEXT_URI,
    json: true,
  });
  return result['value'];
};

module.exports.setContext = async function(context) {
  await rp.post({
    uri: CONTEXT_URI,
    body: {context: context},
    json: true,
  });
};

module.exports.installAddon = async function(path) {
  const result = await rp.post({
    uri: ADDON_INSTALL_URI,
    body: {
      path: path,
      temporary: true,
    },
    json: true,
  });
  return result['value'];
};

module.exports.uninstallAddon = async function(id) {
  await rp.post({
    uri: ADDON_UNINSTALL_URI,
    body: {id: id},
    json: true,
  });
};
