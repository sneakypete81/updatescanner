/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* The Original Code is mozilla.org code.
 * The Initial Developer of the Original Code is
 * Pierre Chanial <chanial@noos.fr>.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * This code is copied from the "AddToBookmarks" context menu item.
 */

// See the end of the file for load/unload observers!

UpdateScanner.Overlay = {

load : function()
{
    var me = UpdateScanner.Overlay;
    // Eventlistener for the main context menu
    var menu = document.getElementById("contentAreaContextMenu");
    if (menu) {
        menu.addEventListener("popupshowing", me._showMenu, false);
    }

    // Eventlistener for the toolbar context menu
    var toolbarmenu = document.getElementById("UpdateScanToolbarMenu");
    if (toolbarmenu) {
        toolbarmenu.addEventListener("popupshowing", me._showToolbarMenu, false);
    }
},

// Don't show context menu item when text is selected, or if URL isn't http*.
_showMenu : function()
{
    if(gContextMenu.isTextSelected || !gBrowser.currentURI.spec.startsWith("http")) {
        document.getElementById("AddToUpdateScan").hidden = true;
    } else {
        document.getElementById("AddToUpdateScan").hidden = false;
    }
},

_showToolbarMenu : function()
{
    // Don't show context menu "Show All Changes" if there are no changes to show.
    var changed = UpdateScanner.Places.queryAnno(UpdateScanner.Places.getRootFolderId(),
                                                 UpdateScanner.Places.ANNO_STATUS,
                                                 UpdateScanner.Places.STATUS_UNKNOWN);
    if (changed == UpdateScanner.Places.STATUS_UPDATE) {
        document.getElementById("ToolbarMenuShowAllChanges").hidden = false;
    } else {
        document.getElementById("ToolbarMenuShowAllChanges").hidden = true;
    }

    // Don't show context menu "Scan Page For Updates" item if URL isn't http*.
    if(!gBrowser.currentURI.spec.startsWith("http")) {
        document.getElementById("ToolbarMenuAddToUpdateScan").hidden = true;
    } else {
        document.getElementById("ToolbarMenuAddToUpdateScan").hidden = false;
    }

    // Show/hide the enable/disable options as appropriate
    var prefBranch = (Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService).
                      getBranch("extensions.updatescan."));

    if (prefBranch.getBoolPref("scan.enable")) {
        document.getElementById("ToolbarMenuDisableScanner").hidden = false;
        document.getElementById("ToolbarMenuEnableScanner").hidden = true;
    } else {
        document.getElementById("ToolbarMenuDisableScanner").hidden = true;
        document.getElementById("ToolbarMenuEnableScanner").hidden = false;
    }
},

onShowAll : function(aEvent)
{
    UpdateScanner.Updatescan.showAllChangesInNewTabs();
},
};

window.addEventListener("load", UpdateScanner.Overlay.load, false);
