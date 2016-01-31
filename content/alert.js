/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Contributor(s):
 *   Scott MacGregor <mscott@netscape.com>
 *   Jens Bannmann <jens.b@web.de>
 */

UpdateScanner.Alert = {

slideIncrement : 4,
slideTime : 20,

openTimeAfterLinkClick : 3000, // Close 3 second after clicking on the link

prefillAlertInfo : function()
{
    var label = document.getElementById("message");
    label.value=window.arguments[0];

},

onAlertLoad : function()
{
  var me = this;
  // read out our initial settings from prefs.
  try
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.notifications.");
    me.openTime = prefBranch.getIntPref("displayTime")*1000;
    me.gPermanent = prefBranch.getBoolPref("permanent");
  } catch (ex) { }

  sizeToContent();

  // be sure to offset the alert by 10 pixels from the far right edge of the screen
  window.moveTo( (screen.availLeft + screen.availWidth - window.outerWidth) - 10, screen.availTop + screen.availHeight);
  me.finalScreenY = screen.availTop + screen.availHeight - window.outerHeight;

  setTimeout(function() {me._animateAlert();}, me.slideTime);

},

_playSound : function()
{
  var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
  prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
  var prefBranch = prefService.getBranch("extensions.updatescan.notifications.");
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService)
  var url;

  if (prefBranch.getBoolPref("defaultSound")) {
      url = "chrome://updatescan/content/defaultNotification.wav";
  } else {
      var file = prefBranch.getComplexValue("soundFile", Components.interfaces.nsILocalFile);
      url = ioService.newFileURI(file).resolve("");
  }

  var audio = document.getElementById("alertSound");
  audio.src = url
  audio.play();
},


onAlertClick : function()
{
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");

    if (win.toggleSidebar) {
       win.toggleSidebar('viewUpdateScanSidebar', true);
    }
    win.focus()
},

onLinkClick : function(aEvent)
{
    var me = this;
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");

    // Can't just call UpdateScanner.Updatescan.Showallchangesinnewtabs, since
    // window value is incorrect in this scope.
    UpdateScanner.Places.callFunctionWithUpdatedItems(UpdateScanner.Places.getRootFolderId(),
                                                      this._diffItemNewTabBackground);
    win.focus();

    // Close the alert soon
    setTimeout(function(){me._closeAlert();}, me.openTimeAfterLinkClick);
    // Don't open the sidebar
    aEvent.stopPropagation();
},

_diffItemNewTabBackground : function(id, delay)
{
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var recentwindow = wm.getMostRecentWindow("navigator:browser");

    var mainWindow = recentwindow.QueryInterface(
    Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = UpdateScanner.Updatescan.diffItem(id, delay);
    if (diffURL) {
      mainWindow.getBrowser().addTab(diffURL);
    }
},

onAlertClose: function()
{
    var me = this;
    me._closeAlert();
},

_animateAlert : function()
{
  var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
  prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
  var prefBranch = prefService.getBranch("extensions.updatescan.notifications.");
  var me = this;
  if (window.screenY > me.finalScreenY) {
    window.screenY -= me.slideIncrement;
    setTimeout(function(){me._animateAlert();}, me.slideTime);
  } else {
      if (prefBranch.getBoolPref("playSound")) {
        me._playSound();
      }
    if (!me.gPermanent) {
      setTimeout(function(){me._closeAlert();}, me.openTime);
    }
  }
},

_closeAlert : function()
{
  var me = this;
  if (window.screenY < (screen.availTop + screen.availHeight))
  {
    window.screenY += me.slideIncrement;
    setTimeout(function(){me._closeAlert();}, me.slideTime);
  } else {
    window.close();
  }
}
};
