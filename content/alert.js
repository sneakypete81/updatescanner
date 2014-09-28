/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Scott MacGregor <mscott@netscape.com>
 *   Jens Bannmann <jens.b@web.de>
 *   Pete Burgers <updatescanner@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

UpdateScanner.Alert = {

gFinalHeight : 50,
gSlideIncrement : 4,
gSlideTime : 20,

gOpenTimeAfterLinkClick : 3000, // Close 3 second after clicking on the link
gPermanent : false, // should the window stay open permanently (until manually closed)

g_MAX_HEIGHT : 134,

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
    me.gOpenTime = prefBranch.getIntPref("displayTime")*1000;
    me.gPermanent = prefBranch.getBoolPref("permanent");
  } catch (ex) { }

  sizeToContent();

  me.gFinalHeight = window.outerHeight;  //134  5 lines - 152 6 lines
  if ( me.gFinalHeight > me.g_MAX_HEIGHT ) {
      me.gFinalHeight = me.g_MAX_HEIGHT;
  }

  window.outerHeight = 1;

  // be sure to offset the alert by 10 pixels from the far right edge of the screen
  window.moveTo( (screen.availLeft + screen.availWidth - window.outerWidth) - 10, screen.availTop + screen.availHeight - window.outerHeight);

  setTimeout(function() {me._animateAlert();}, me.gSlideTime);

},

_playSound : function()
{
  var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
  prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
  var prefBranch = prefService.getBranch("extensions.updatescan.notifications.");
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService)
  var url;
  var player = Components.classes["@mozilla.org/sound;1"]
                         .createInstance(Components.interfaces.nsISound);

  try {
      if (prefBranch.getBoolPref("defaultSound")) {
          url = ioService.newURI("chrome://updatescan/content/defaultNotification.wav",null,null);
      } else {
          var file = prefBranch.getComplexValue("soundFile", Components.interfaces.nsILocalFile);
          url = ioService.newFileURI(file);
      }
      player.init();
      player.play(url);
  } catch(ex) { }
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
    setTimeout(function(){me._closeAlert();}, me.gOpenTimeAfterLinkClick);
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
  if (window.outerHeight < me.gFinalHeight) {
    window.screenY -= me.gSlideIncrement;
    window.outerHeight += me.gSlideIncrement;
    setTimeout(function(){me._animateAlert();}, me.gSlideTime);
  } else {
      if (prefBranch.getBoolPref("playSound")) {
        me._playSound();
      }
    if (!me.gPermanent) {
      setTimeout(function(){me._closeAlert();}, me.gOpenTime);
    }
  }
},

_closeAlert : function()
{
  var me = this;
  if (window.outerHeight > 1)
  {
    window.screenY += me.gSlideIncrement;
    window.outerHeight -= me.gSlideIncrement;
    setTimeout(function(){me._closeAlert();}, me.gSlideTime);
  }
  else
  {
    window.close();
  }
}
};
