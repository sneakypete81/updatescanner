/* ***** BEGIN LICENSE BLOCK *****
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is Update Scanner.
 * 
 * The Initial Developer of the Original Code is Pete Burgers.
 * Portions created by Pete Burgers are Copyright (C) 2006-2007
 * All Rights Reserved.
 * 
 * Contributor(s):
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
 * ***** END LICENSE BLOCK ***** */



// See the end of the file for load/unload observers!



if (typeof(USc_statusbar_exists) != 'boolean') {
var USc_statusbar_exists = true;

var USc_statusbarBookmarkObserver = {
  onBeginUpdateBatch: function() {},
  onEndUpdateBatch: function() {},
  onItemAdded: function(aItemId, aFolder, aIndex) {},
  onItemVisited: function(aBookmarkId, aVisitID, time) {},
  onItemChanged: function(aBookmarkId, aProperty, aIsAnnotationProperty, aValue) {},

  onItemRemoved: function(aItemId, aFolder, aIndex) {
    // Update parent annotations if a bookmark gets deleted
    USc_places.updateFolderStatus(aFolder);
  },
 
  onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
    // Update parent annotations if a bookmark gets moved
    USc_places.updateFolderStatus(aOldParent);
    USc_places.updateFolderStatus(aNewParent);
  },

  QueryInterface: function(iid) {
    if (iid.equals(Ci.nsINavBookmarkObserver) || iid.equals(Ci.nsISupports)) {
      return this;
    }
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

var USc_statusbarAnnotationObserver = {
  onPageAnnotationSet : function(aURI, aName) { },
  onPageAnnotationRemoved : function(aURI, aName) { },
  onItemAnnotationRemoved : function(aItemId, aName) { },
  
  onItemAnnotationSet : function(aItemId, aName) {
    if (aName == USc_places.ANNO_STATUS)
    {
      // Stop the cascade if we've reached the root
      if (aItemId == USc_places.getRootFolderId()) {
        USc_statusbar.refresh();
        return;
      }
      // Start an upwards cascade of annotation updates (as far as necessary)
      USc_places.updateFolderStatus(USc_places.getParentFolder(aItemId));
    }
  }  
};

var USc_statusbarEnablePrefObserver = {
    // Refresh the status bar if the scan.enable preference changes
    observe: function(subject, topic, data)
    {
        if (topic == "nsPref:changed" && data == "scan.enable") {
            USc_statusbar.refresh();
        }
    }
};

var USc_statusbar = {   
    prefs: null,

load : function()
{
    var me = USc_statusbar;
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);

    // Update parent folder annotations when an annotation is updated
    PlacesUtils.annotations.addObserver(USc_statusbarAnnotationObserver);

    // Update parent folder annotations when bookmarks are moved/deleted
    bmsvc.addObserver(USc_statusbarBookmarkObserver, false);

    me.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefService)
                           .getBranch("extensions.updatescan.");
    me.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

    // Update statusbar icon when scanner is disabled/enabled
    me.prefs.addObserver("scan.enable", USc_statusbarEnablePrefObserver, false);


    // Make sure we have a root folder
    try {
        USc_places.getRootFolderId();
    } catch (e) {
        USc_places.createRootFolder();
    }

    // See if we need to upgrade something
    USc_upgrade.check();

    // Start autoscanner
    USc_autoscan.start(me.autoscanFinished);

    // Update the status bar icon
    me.refresh();
},

unload : function()
{
    var me = USc_statusbar;
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);
    try { 
      PlacesUtils.annotations.removeObserver(USc_statusbarAnnotationObserver);
    } catch(e) {}

    try { 
        bmsvc.removeObserver(USc_statusbarBookmarkObserver);
    } catch(e) {}
 
    try { 
        this.prefs.removeObserver("scan.enable", USc_statusbarBookmarkObserver);
    } catch(e) {}
},

autoscanFinished : function(numChanges)
{
//    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
//                        .getService(Components.interfaces.nsIAlertsService); 
    var me = USc_statusbar;

    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");

    var alertOneChange = strings.GetStringFromName("alertOneChange");
    var param;
    var alertManyChanges = strings.GetStringFromName("alertManyChanges");

    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.");

    var message;

    if (numChanges && prefBranch.getBoolPref("notifications.enable")) {
        if (numChanges == 1) {
            message = alertOneChange;
        } else {
            param = {numChanges:numChanges};
            message = alertManyChanges.USc_supplant(param);
        }
        window.openDialog("chrome://updatescan/content/alert.xul",
                  "alert:alert",
                  "chrome,dialog=yes,titlebar=no,popup=yes",
                  message);
    }
},

refresh : function()
{
    var me = USc_statusbar;
    var statusbar = document.getElementById("UpdateScanStatusbar");

    // Check the status annotation on the root folder
    var changed = USc_places.queryAnno(USc_places.getRootFolderId(),
                                       USc_places.ANNO_STATUS,
                                       USc_places.STATUS_UNKNOWN);
    var enabled = me.prefs.getBoolPref("scan.enable");
          
    if (changed == USc_places.STATUS_UPDATE) {
        if (enabled) {
            statusbar.setAttribute("status", "CHANGE");
        } else {
            statusbar.setAttribute("status", "CHANGE_DISABLED");
        }
    } else {
        if (enabled) {
            statusbar.setAttribute("status", "NO_CHANGE");
        } else {
            statusbar.setAttribute("status", "NO_CHANGE_DISABLED");
        }
    }
}
}
}

window.addEventListener("load", USc_statusbar.load, false);
window.addEventListener("unload", USc_statusbar.unload, false);
