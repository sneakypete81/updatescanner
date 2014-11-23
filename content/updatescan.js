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
 * Portions from Sage project:
 * Peter Andrews <petea@jhu.edu>
 * Erik Arvidsson <erik@eae.net>

 * Portions from Boox project:
 * Nicolas Martin http://joliclic.free.fr
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

UpdateScanner.Defaults = {
    DEF_THRESHOLD : 100,
    DEF_SCAN_RATE_MINS : 1440, // Scan once per day by default
    DEF_IGNORE_NUMBERS : true,
    DEF_ENCODING : "auto",
    DEF_LAST_SCAN : "5 November 1978",
    DEF_OLD_LAST_SCAN : "5 November 1978",
    DEF_LAST_AUTOSCAN : "5 November 1978",
    DEF_HIGHLIGHT_CHANGES : true,
    DEF_HIGHLIGHT_COLOUR : "#ffff66",
    DEF_ENABLE_SCRIPT : true,
    DEF_ENABLE_FLASH : true
};

UpdateScanner.Updatescan = {

numChanges : 0,
refresh : null,
scan: null,
_branch: null,
tree : null,

load : function()
{
    var me = UpdateScanner.Updatescan;
    var r;

    me._extendPlacesTreeView();

    me.tree = document.getElementById("updatescan-bookmarks-view");
    me.tree.onclick=me._treeClick;

    try {
      var rootFolderId = UpdateScanner.Places.getRootFolderId();
    } catch (e) {
      var rootFolderId = UpdateScanner.Places.createRootFolder();
    }
    me.tree.place = "place:queryType=1&folder=" + rootFolderId;

    PlacesUtils.annotations.addObserver(UpdateScanner.SidebarAnnotationObserver);

    // Check for toolbar button changes
    me._branch = Components.classes["@mozilla.org/preferences-service;1"];
    me._branch = me._branch.getService(Components.interfaces.nsIPrefService);
    me._branch = me._branch.getBranch("extensions.updatescan.toolbar.");
    me._branch.QueryInterface(Components.interfaces.nsIPrefBranch);
    me._branch.addObserver("", this, false);
    me._updateToolbar();

    // Eventlistener for the main context menu
    var menu = document.getElementById("updatescanSidebarContext");
    if (menu) {
        menu.addEventListener("popupshowing", me._showMenu, false);
    }

    this._showScanButton();
},

unload : function()
{
    var me = UpdateScanner.Updatescan;

    try {
      PlacesUtils.annotations.removeObserver(UpdateScanner.SidebarAnnotationObserver);
    } catch(e) {}
    try {
      me._branch.removeObserver("", this);
    } catch(e) {}
},

// Show/hide menu items depending on whether folder or bookmark is selected
_showMenu : function()
{
    var me = UpdateScanner.Updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;
    if (UpdateScanner.Places.isFolder(id)) {
        document.getElementById("open").hidden = true;
        document.getElementById("openItemTab").hidden = true;
        document.getElementById("openFolderTab").hidden = false;
        document.getElementById("scanPage").hidden = true;
        document.getElementById("scanFolder").hidden = false;
        document.getElementById("placesContext_sortBy:name").hidden = false;
    } else {
        document.getElementById("open").hidden = false;
        document.getElementById("openItemTab").hidden = false;
        document.getElementById("openFolderTab").hidden = true;
        document.getElementById("scanPage").hidden = false;
        document.getElementById("scanFolder").hidden = true;
        document.getElementById("placesContext_sortBy:name").hidden = true;
    }
},

observe: function(aSubject, aTopic, aData) // Observe toolbar button preference changes
{
    var me = UpdateScanner.Updatescan;
    if (aTopic == "nsPref:changed") {
    me._updateToolbar();
    }
},

_treeClick : function(aEvent) {
    var me = UpdateScanner.Updatescan;
    var prefBranch = (Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService).
                      getBranch("extensions.updatescan."));

    if (aEvent.button == 2) {
      return;
    }

    var tbo = me.tree.treeBoxObject;
    var row = { }, col = { }, obj = { };
    tbo.getCellAt(aEvent.clientX, aEvent.clientY, row, col, obj);

    if (row.value == -1 || obj.value == "twisty") {
      return;
    }

    var modifKey = aEvent.metaKey || aEvent.ctrlKey || aEvent.shiftKey;
    var newtab_leftclick = prefBranch.getBoolPref("scan.newtab_leftclick");

    switch (aEvent.button) {
        case 0:
            if (modifKey || newtab_leftclick) {
                me.diffSelectedItemNewTab();
            } else {
                me.diffSelectedItemThisWindow();
            }
            break;
        case 1:
            me.diffSelectedItemNewTab();
            break;
    }
},

scanButtonClick : function()
{
    var me = UpdateScanner.Updatescan;
    var scanbutton = document.getElementById("scanbutton");
    var id;
    var numitems;
    var str=document.getElementById("updatescanStrings");
    var ignoreNumbers;
    var encoding;

    // Is the scan button showing "Cancel"?
    if (scanbutton.getAttribute("label") == scanbutton.getAttribute("stopbuttonlabel")) {
        if (me.scan != null) {
            me.scan.cancel();
        }
        me._hideProgress();
        me._showScanButton();
        me._setStatus(str.getString("statusCancel"));
        return;
    }

    me._showStopButton();

    me.scan = new UpdateScanner.Scan.scanner();
    me.numChanges = 0;

    if (me.scan.addItems(UpdateScanner.Places.getRootFolderId(), false) > 0)
    {
      me.scan.start(me._scanChangedCallback,
                    me._scanFinishedCallback,
                    me._showProgress,
                    me._scanEncodingCallback);
    } else {
        me.numChanges = 0;
        me._scanFinishedCallback(str.getString("treeEmptyAlert"));
    }

},

scanSelected : function()
{
    var me = UpdateScanner.Updatescan;

    me._showStopButton();

    me.scan = new UpdateScanner.Scan.scanner();
    me.numChanges = 0;

    if (me.scan.addItems(me._getSelectedItem(), false) > 0)
    {
      me.scan.start(me._scanChangedCallback,
                    me._scanFinishedCallback,
                    me._showProgress,
                    me._scanEncodingCallback);
    } else {
      me._scanFinishedCallback();
    }
},

_scanChangedCallback : function(id, new_content, status, statusText, headerText)
{
    var me = UpdateScanner.Updatescan;
    if (UpdateScanner.Scan.processScanChange(id, new_content, status, statusText, headerText)) {
        me.numChanges++;
    }
},

_scanEncodingCallback : function(id, encoding)
// Called when encoding is detected for a page marked for auto-detect encoding
{
    UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_ENCODING, encoding);
},

_scanFinishedCallback : function()
{
    var me = UpdateScanner.Updatescan;
    var str=document.getElementById("updatescanStrings");
    var param;
    var message;
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.");

    if (me.numChanges == 0) {
        me._setStatus(str.getString("statusNoChanges"));
    } else if (prefBranch.getBoolPref("notifications.enable")) {
        if (me.numChanges == 1) {
            me._setStatus(str.getString("statusOneChange"));
            message = str.getString("alertOneChange");
        } else {
            param = {numChanges:me.numChanges};
            me._setStatus(UpdateScanner.supplant(str.getString("statusManyChanges"), param));
            message = UpdateScanner.supplant(str.getString("alertManyChanges"), param);
        }
        window.openDialog("chrome://updatescan/content/alert.xul",
                  "alert:alert",
                  "chrome,dialog=yes,titlebar=no,popup=yes",
                  message);
    }
    me._hideProgress();
    me._showScanButton();
},

openNewDialogCurrentPos : function()
// Opens a "New Item" dialog, and saves the new bookmark in the correct position
{
  var me = UpdateScanner.Updatescan;
  var id = me._getSelectedItem();
  if (id == undefined)
    me.openNewDialog();
  else if (UpdateScanner.Places.isFolder(id))
    me.openNewDialog(id);
  else
    me.openNewDialog(UpdateScanner.Places.getParentFolder(id),
                     UpdateScanner.Places.getIndex(id));
},

openNewDialog : function(parentId, index)
{
    if (typeof parentId == 'undefined' )
      parentId = UpdateScanner.Places.getRootFolderId();
    if (typeof index == 'iundefined')
      index = -1; // Insert at the bottom by default

    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);

    var url = mainWindow.content.document.URL;
    var title = mainWindow.content.document.title || url;

    var args = {
        title:            title,
        url:              url,
        threshold:        UpdateScanner.Defaults.DEF_THRESHOLD,
        scanRateMins:     UpdateScanner.Defaults.DEF_SCAN_RATE_MINS,
        encoding:         UpdateScanner.Defaults.DEF_ENCODING,
        ignoreNumbers:    UpdateScanner.Defaults.DEF_IGNORE_NUMBERS,
        highlightChanges: UpdateScanner.Defaults.DEF_HIGHLIGHT_CHANGES,
        highlightColour:  UpdateScanner.Defaults.DEF_HIGHLIGHT_COLOUR,
        advanced:         false
    };

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgNew',
                      'chrome,dialog,modal,centrescreen', args);
    if (args.ok) {
        var id = UpdateScanner.Places.addBookmark(args.title, args.url, parentId, index);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_THRESHOLD, args.threshold);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_SCAN_RATE_MINS, args.scanRateMins);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_ENCODING, args.encoding);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_IGNORE_NUMBERS, args.ignoreNumbers);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_CHANGES, args.highlightChanges);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_COLOUR, args.highlightColour);

        var filebase=UpdateScanner.Places.getSignature(id);
        UpdateScanner.File.USwriteFile(filebase+".new", "");

        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_LAST_SCAN, "");
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_STATUS, UpdateScanner.Places.STATUS_NO_UPDATE);
    }
},

openEditDialogForSelected : function()
{
    var me = UpdateScanner.Updatescan;
    var id = me._getSelectedItem();
    me.openEditDialog(id);
},

openEditDialog : function(id)
{
    if (id == undefined)
      return;

    // Launch the folder properties dialog
    if (UpdateScanner.Places.isFolder(id))
    {
         PlacesUIUtils.showItemProperties(id, "folder");
         return;
    }

    var args = {
        title:            UpdateScanner.Places.getTitle(id),
        url:              UpdateScanner.Places.getURL(id),
        threshold:        UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_THRESHOLD,
                                                         UpdateScanner.Defaults.DEF_THRESHOLD),
        scanRateMins:     UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_SCAN_RATE_MINS,
                                                         UpdateScanner.Defaults.DEF_SCAN_RATE_MINS),
        encoding:         UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_ENCODING,
                                                         UpdateScanner.Defaults.DEF_ENCODING),
        ignoreNumbers:    UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_IGNORE_NUMBERS,
                                                         UpdateScanner.Defaults.DEF_IGNORE_NUMBERS),
        advanced:         false,
        highlightChanges: UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_CHANGES,
                                                         UpdateScanner.Defaults.DEF_HIGHLIGHT_CHANGES),
        highlightColour:  UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_COLOUR,
                                                         UpdateScanner.Defaults.DEF_HIGHLIGHT_COLOUR),
    };

    var oldurl = args.url;

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgEdit',
                      'chrome,dialog,modal,centrescreen', args);

    if (args.ok) {
        UpdateScanner.Places.setTitle(id, args.title);
        UpdateScanner.Places.setURL(id, args.url);

        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_THRESHOLD, args.threshold);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_SCAN_RATE_MINS, args.scanRateMins);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_ENCODING, args.encoding);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_IGNORE_NUMBERS, args.ignoreNumbers);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_CHANGES, args.highlightChanges);
        UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_COLOUR, args.highlightColour);

        if (oldurl != args.url) {   // URL changed - reset all values
          // Create a new signature
          UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_SIGNATURE, "");
          var filebase=UpdateScanner.Places.getSignature(id);
          UpdateScanner.File.USwriteFile(filebase+".new", "");

          UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_LAST_SCAN, "");
          UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_STATUS, UpdateScanner.Places.STATUS_NO_UPDATE);
        }
    }
},

openPreferences : function()
{
    window.openDialog('chrome://updatescan/content/preferences.xul',
                      'dlgUpdatescannerPreferences',
                      'chrome,toolbar,dialog=no,resizable,centerscreen');
},

diffItem : function(id, delay)
{
    var me = UpdateScanner.Updatescan;

    if (UpdateScanner.Places.isFolder(id))
      return undefined;

    var now = new Date();

    me._markAsVisited(id);

    var old_lastScan = UpdateScanner.Places.queryAnno(id,
                                            UpdateScanner.Places.ANNO_OLD_LAST_SCAN,
                                            UpdateScanner.Defaults.DEF_OLD_LAST_SCAN);
    old_lastScan = new Date(old_lastScan);

    var oldDate = me._dateDiffString(old_lastScan, now);

    var lastScan = UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_LAST_SCAN, UpdateScanner.Defaults.DEF_LAST_SCAN);
    lastScan = new Date(lastScan);

    var newDate = me._dateDiffString(lastScan, now);

    if (UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_CHANGES,
                                       UpdateScanner.Defaults.DEF_HIGHLIGHT_CHANGES)) {
        var url = ("about:updatescan?id="+escape(id)+
                   "&title="+escape(UpdateScanner.Places.getTitle(id))+
                   "&url="+escape(UpdateScanner.Places.getURL(id))+
                   "&oldDate="+escape(oldDate)+
                   "&newDate="+escape(newDate)+
                   "&delay="+escape(delay));
    } else {
        // Don't highlight - just show the page
        var url = UpdateScanner.Places.getURL(id);
    }

    return url;
},

diffSelectedItemThisWindow : function()
{
    var me = UpdateScanner.Updatescan;
    var item = me._getSelectedItem();
    if (item == undefined)
      return;
    me._diffItemThisWindow(item);
},

_diffItemThisWindow : function(id)
{
    var me = UpdateScanner.Updatescan;
    var diffURL = me.diffItem(id, 0);
    if (diffURL) {
        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                               .getInterface(Components.interfaces.nsIWebNavigation)
                               .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                               .rootTreeItem
                               .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                               .getInterface(Components.interfaces.nsIDOMWindow);
        mainWindow.getBrowser().selectedBrowser.contentWindow.location.href = diffURL;
        if (me.tree) me.tree.focus();
    }
},

showAllChangesInNewTabs : function()
{
  UpdateScanner.Places.callFunctionWithUpdatedItems(UpdateScanner.Places.getRootFolderId(),
                                                    UpdateScanner.Updatescan._diffItemNewTabBackground);
},

diffSelectedFolderNewTab : function()
{
    var me = UpdateScanner.Updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    UpdateScanner.Places.callFunctionWithUpdatedItems(id, UpdateScanner.Updatescan._diffItemNewTab);
},

diffSelectedItemNewTab : function()
{
    var me = UpdateScanner.Updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    me._diffItemNewTab(id, 0);
},

_diffItemNewTab : function(id, delay)
{
    var me = UpdateScanner.Updatescan;

    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                           .getInterface(Components.interfaces.nsIWebNavigation)
                           .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                           .rootTreeItem
                           .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                           .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = me.diffItem(id, delay);
    if (diffURL) {
      mainWindow.getBrowser().selectedTab = mainWindow.getBrowser().addTab(diffURL);
      if (me.tree) me.tree.focus();
    }
},

_diffItemNewTabBackground : function(id, delay)
{
    var me = UpdateScanner.Updatescan;

    var mainWindow = window.QueryInterface(
    Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = me.diffItem(id, delay);
    if (diffURL) {
      mainWindow.getBrowser().addTab(diffURL);
      if (me.tree) me.tree.focus();
    }
},

_dateDiffString : function(oldDate, newDate)
{
    var ret;
    var time;
    var str=document.getElementById("updatescanStrings");

    var diff = newDate.getTime() - oldDate.getTime();
    diff = diff / 1000; // convert to seconds
    diff = diff / 60;   // minutes
    diff = diff / 60;   // hours
    if (diff < 24) {
        time = oldDate.getHours()+":";
        var mins = oldDate.getMinutes().toString();
        if (mins.length == 1) {
            mins = "0" + mins;
        }
        time += mins;

        if (oldDate.getDate() != newDate.getDate()) {
            return UpdateScanner.supplant(str.getString("yesterdayAt"), {time:time});
        } else {
            return UpdateScanner.supplant(str.getString("todayAt"), {time:time});
        }
    }

    diff = diff / 24;
    if (diff < 7) {
        diff = Math.floor(diff);
        if (diff == 1) {
            return str.getString("dayAgo");
        } else {
            return UpdateScanner.supplant(str.getString("daysAgo"), {numDays:diff});
        }
    }
    diff = diff / 7;
    diff = Math.floor(diff);
    if (diff == 1) {
        return str.getString("weekAgo");
    } else {
        return UpdateScanner.supplant(str.getString("weeksAgo"), {numWeeks:diff});
    }
},

markAllAsVisited : function()
{
  UpdateScanner.Places.callFunctionWithUpdatedItems(UpdateScanner.Places.getRootFolderId(),
                                                    UpdateScanner.Updatescan._markAsVisited);
},

_markAsVisited : function(id, delay)
{
    if (UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_STATUS, "") == UpdateScanner.Places.STATUS_UPDATE)
    {
      UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_STATUS, UpdateScanner.Places.STATUS_NO_UPDATE);
    }
},

openHelp : function()
{
    var mainWindow = window.QueryInterface(
                  Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIWebNavigation)
                  .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                  .rootTreeItem
                  .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                  .getInterface(Components.interfaces.nsIDOMWindow);

    var helpURL="http://sneakypete81.github.io/updatescanner/";

    mainWindow.getBrowser().selectedTab = mainWindow.getBrowser().addTab(helpURL);
},

enableScanner : function()
{
    var prefBranch = (Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService).
                      getBranch("extensions.updatescan."));

    prefBranch.setBoolPref("scan.enable", true);
},

disableScanner : function()
{
    var prefBranch = (Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService).
                      getBranch("extensions.updatescan."));

    prefBranch.setBoolPref("scan.enable", false);
},

_getSelectedItem : function()
{
    var me = UpdateScanner.Updatescan;
    if (me.tree.selectedNode)
        return me.tree.selectedNode.itemId;
    else
        return undefined;
},

deleteSelectedItem : function()
// TODO: currently doesn't delete .old and .new files when entire folders are deleted.
{
    var me = UpdateScanner.Updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    try {
        var filebase=UpdateScanner.Places.getSignature(id);

//    if (confirm(str.getString("confirmDelete") + " " + title + "?")) {
        UpdateScanner.File.USrmFile(filebase+".old");
        UpdateScanner.File.USrmFile(filebase+".new");
    } catch (ex) { }
    UpdateScanner.Places.deleteBookmark(id);
},

_showStopButton : function()
{
    var scanbutton = document.getElementById("scanbutton");
    scanbutton.setAttribute("label", scanbutton.getAttribute("stopbuttonlabel"));
},

_showScanButton : function()
{
    var scanbutton = document.getElementById("scanbutton");
    scanbutton.setAttribute("label", scanbutton.getAttribute("scanbuttonlabel"));
},

_setStatus : function (status)
{
    document.getElementById("StatusText").value = status;
},

_showProgress : function(title, value, max)
{
    var me = UpdateScanner.Updatescan;
    var str=document.getElementById("updatescanStrings");
    var param = {title:title};
    me._setStatus(UpdateScanner.supplant(str.getString("statusScanning"), param));

    var progress = document.getElementById("Progress");
    progress.collapsed = false;
    progress.value = 100*value/max;
},

_hideProgress : function()
{
    document.getElementById("Progress").collapsed=true;
},

_updateToolbar : function()
{
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.toolbar.");

    document.getElementById("new-button").hidden = !prefBranch.getBoolPref("new");
    document.getElementById("newtab-button").hidden = !prefBranch.getBoolPref("newTab");
    document.getElementById("checked-button").hidden = !prefBranch.getBoolPref("markVisited");
    document.getElementById("delete-button").hidden = !prefBranch.getBoolPref("delete");
    document.getElementById("settings-button").hidden = !prefBranch.getBoolPref("preferences");
    document.getElementById("help-button").hidden = !prefBranch.getBoolPref("help");
},

// Adapted from the Sage & Boox Extensions:
_extendPlacesTreeView : function() {
    PlacesTreeView.prototype.getCellPropertiesBase = PlacesTreeView.prototype.getCellProperties;

    // Assuming we're running Firefox
    var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                            .getService(Components.interfaces.nsIXULAppInfo);
    var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                                   .getService(Components.interfaces.nsIVersionComparator);
    if(versionChecker.compare(appInfo.version, "22.0a1") >= 0) {
    // Firefox 22 or later
        PlacesTreeView.prototype.getCellProperties =
        function ext_getCellProperties(aRow, aColumn) {
            var properties = this.getCellPropertiesBase(aRow, aColumn);
            var node = this._rows[aRow];

            if (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER ||
                (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI)) {
                try {
                    var state = "usc_state_" + PlacesUtils.annotations.getItemAnnotation(node.itemId, UpdateScanner.Places.ANNO_STATUS);
                } catch (e) {
                    return properties;
                }

                if (state == "usc_state_updated") {
                    properties += " usc_state_updated";
                }
                if (state == "usc_state_error") {
                    properties += " usc_state_error";
                }
            }
            return properties;
        };
    } else {
        // Before Firefox 22
        PlacesTreeView.prototype.getCellProperties =
        function ext_getCellProperties(aRow, aColumn, aProperties) {
            this.getCellPropertiesBase(aRow, aColumn, aProperties);

            var node = this._rows[aRow];
            if (this._cellProperties) {
                // FF15 and later
                var properties = this._cellProperties.get(node)
            } else {
                // FF14 and earlier
                var properties = node._cellProperties;
            }
            var newProperties = new Array();

            if (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER ||
                (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI)) {
                try {
                    var state = "usc_state_" + PlacesUtils.annotations.getItemAnnotation(node.itemId, UpdateScanner.Places.ANNO_STATUS);
                } catch (e) {
                    return;
                }
            } else {
                return;
            }
            var index = aProperties.GetIndexOf(this._getAtomFor("usc_state_updated"));
            if (state == "usc_state_updated") {
                if (index == -1) {
                    newProperties.push(this._getAtomFor("usc_state_updated"))
                }
            } else {
                if (index != -1) {
                    aProperties.DeleteElementAt(index);
                }
            }

            var index = aProperties.GetIndexOf(this._getAtomFor("usc_state_error"));
            if (state == "usc_state_error") {
                if (index == -1) {
                    newProperties.push(this._getAtomFor("usc_state_error"))
                }
            } else {
                if (index != -1) {
                    aProperties.DeleteElementAt(index);
                }
            }

            for (var i = 0, l = newProperties.length; i < l; i++) {
                aProperties.AppendElement(newProperties[i]);
                properties.push(newProperties[i]);
            }
        };
    }

},

myDump : function(aMessage) {
    dump(aMessage);
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                         .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("UpdateScan: " + aMessage);
},
};

UpdateScanner.SidebarAnnotationObserver = {

  onPageAnnotationSet : function(aURI, aName) { },

  onItemAnnotationSet : function(aItemId, aName) {
    switch (aName) {
      case UpdateScanner.Places.ANNO_ROOT:
        UpdateScanner.Updatescan.tree.place = "place:queryType=1&folder=" + aItemId;
        break;
      case UpdateScanner.Places.ANNO_STATUS:
        var bx = UpdateScanner.Updatescan.tree.boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject);
        setTimeout(function(a){a.invalidate();}, 0 ,bx);
        break;
    }
  },

  onPageAnnotationRemoved : function(aURI, aName) { },

  onItemAnnotationRemoved : function(aItemId, aName) { }

};
