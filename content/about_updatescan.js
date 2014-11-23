// Registers the "about:updatescan" handler
// From https://developer.mozilla.org/en-US/docs/Custom_about:_URLs

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function AboutUpdatescan() { }
AboutUpdatescan.prototype = {
  classDescription: "about:updatescan",
  contractID: "@mozilla.org/network/protocol/about;1?what=updatescan",
  classID: Components.ID("7e4d1590-7326-11e4-82f8-0800200c9a66"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
  
  getURIFlags: function(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  
  newChannel: function(aURI) {
    let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let channel = ios.newChannel("chrome://updatescan/content/diffPage.xul", null, null);
    channel.originalURI = aURI;
    return channel;
  }
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutUpdatescan]);