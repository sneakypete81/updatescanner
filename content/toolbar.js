/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Contributor(s):
 * Wladimir Palant (adblockplus code to handle toolbar buttons)
 */



// See the end of the file for load/unload observers!



UpdateScanner.BookmarkObserver = {
  onBeforeItemRemoved: function() {},
  onBeginUpdateBatch: function() {},
  onEndUpdateBatch: function() {},
  onItemAdded: function(aItemId, aFolder, aIndex) {},
  onItemVisited: function(aBookmarkId, aVisitID, time) {},
  onItemChanged: function(aBookmarkId, aProperty, aIsAnnotationProperty, aValue) {},

  onItemRemoved: function(aItemId, aFolder, aIndex) {
    // Update parent annotations if a bookmark gets deleted
    UpdateScanner.Places.updateFolderStatus(aFolder);
  },

  onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
    // Update parent annotations if a bookmark gets moved
    UpdateScanner.Places.updateFolderStatus(aOldParent);
    UpdateScanner.Places.updateFolderStatus(aNewParent);
  },

  QueryInterface: function(iid) {
    if (iid.equals(Ci.nsINavBookmarkObserver) || iid.equals(Ci.nsISupports)) {
      return this;
    }
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

UpdateScanner.AnnotationObserver = {
  onPageAnnotationSet : function(aURI, aName) { },
  onPageAnnotationRemoved : function(aURI, aName) { },
  onItemAnnotationRemoved : function(aItemId, aName) { },

  onItemAnnotationSet : function(aItemId, aName) {
    if (aName == UpdateScanner.Places.ANNO_STATUS)
    {
      // Stop the cascade if we've reached the root
      if (aItemId == UpdateScanner.Places.getRootFolderId()) {
        UpdateScanner.Toolbar.refresh();
        return;
      }
      // Start an upwards cascade of annotation updates (as far as necessary)
      UpdateScanner.Places.updateFolderStatus(UpdateScanner.Places.getParentFolder(aItemId));
    }
  }
};

UpdateScanner.EnablePrefObserver = {
    // Refresh the toolbar if the scan.enable preference changes
    observe: function(subject, topic, data)
    {
        if (topic == "nsPref:changed" && data == "scan.enable") {
            UpdateScanner.Toolbar.refresh();
        }
    }
};

UpdateScanner.Toolbar = {
    prefs: null,

load : function()
{
    var me = UpdateScanner.Toolbar;
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);

    // Update parent folder annotations when an annotation is updated
    PlacesUtils.annotations.addObserver(UpdateScanner.AnnotationObserver);

    // Update parent folder annotations when bookmarks are moved/deleted
    bmsvc.addObserver(UpdateScanner.BookmarkObserver, false);

    me.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefService)
                           .getBranch("extensions.updatescan.");
    me.prefs.QueryInterface(Components.interfaces.nsIPrefBranch);

    // Update toolbar icon when scanner is disabled/enabled
    me.prefs.addObserver("scan.enable", UpdateScanner.EnablePrefObserver, false);

    // Make sure we have a root folder
    try {
        UpdateScanner.Places.getRootFolderId();
    } catch (e) {
        UpdateScanner.Places.createRootFolder();
    }

    // See if we need to upgrade something
    UpdateScanner.Upgrade.check();

    // Start autoscanner
    UpdateScanner.Autoscan.start(me.autoscanFinished);

    // Update the toolbar icon
    me.refresh();
},

unload : function()
{
    var me = UpdateScanner.Toolbar;
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);
    try {
      PlacesUtils.annotations.removeObserver(UpdateScanner.AnnotationObserver);
    } catch(e) {}

    try {
        bmsvc.removeObserver(UpdateScanner.BookmarkObserver);
    } catch(e) {}

    try {
        this.prefs.removeObserver("scan.enable", UpdateScanner.BookmarkObserver);
    } catch(e) {}
},

installAddonbarIcon : function()
// Inserts the toolbar icon into the addonbar
// Adapted from adblockplus.org AppIntegration.jsm
{
    var toolbar = document.getElementById("addon-bar");
    if (!toolbar || typeof toolbar.insertItem != "function")
        return;

    toolbar.insertItem("tools-updatescan-button", document.getElementById("addonbar-closebutton"), null, false);
    toolbar.setAttribute("currentset", toolbar.currentSet);
    document.persist(toolbar.id, "currentset");

    // Ensure the addon bar is shown
    toolbar.setAttribute("collapsed", "false");
    document.persist(toolbar.id, "collapsed");

    UpdateScanner.Toolbar.refresh();
},

autoscanFinished : function(numChanges)
{
//    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
//                        .getService(Components.interfaces.nsIAlertsService);
    var me = UpdateScanner.Toolbar;

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
            message = UpdateScanner.supplant(alertManyChanges, param);
        }
        window.openDialog("chrome://updatescan/content/alert.xul",
                  "alert:alert",
                  "chrome,dialog=yes,titlebar=no,popup=yes",
                  message);
    }
},

refresh : function()
{
    var me = UpdateScanner.Toolbar;
    var toolbar = document.getElementById("tools-updatescan-button");
    if (!toolbar)
        return;

    // Check the status annotation on the root folder
    var changed = UpdateScanner.Places.queryAnno(UpdateScanner.Places.getRootFolderId(),
                                                 UpdateScanner.Places.ANNO_STATUS,
                                                 UpdateScanner.Places.STATUS_UNKNOWN);
    var enabled = me.prefs.getBoolPref("scan.enable");

    if (changed == UpdateScanner.Places.STATUS_UPDATE) {
        if (enabled) {
            toolbar.setAttribute("status", "CHANGE");
        } else {
            toolbar.setAttribute("status", "CHANGE_DISABLED");
        }
    } else {
        if (enabled) {
            toolbar.setAttribute("status", "NO_CHANGE");
        } else {
            toolbar.setAttribute("status", "NO_CHANGE_DISABLED");
        }
    }
},
};

window.addEventListener("load", UpdateScanner.Toolbar.load, false);
window.addEventListener("unload", UpdateScanner.Toolbar.unload, false);
