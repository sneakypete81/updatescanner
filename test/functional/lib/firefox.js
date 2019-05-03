const rp = require('request-promise-native');

const CONTEXT_URI = (
  browser.config.baseUrl + ':4444' + browser.config.path +
  'session/' + browser.sessionId + '/moz/context'
);

module.exports.getContext = async function() {
  const result = await rp({
    uri: CONTEXT_URI,
    json: true,
  });
  return result['value'];
};

module.exports.setContext = async function(context) {
  const result = await rp.post({
    uri: CONTEXT_URI,
    body: {context: context},
    json: true,
  });
  return result['value'];
};
