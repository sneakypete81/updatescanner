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

 
if (typeof(USc_updatescan_exists) != 'boolean') {
var USc_updatescan_exists = true;

var USc_defaults = {
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

var USc_updatescan = {    

numChanges : 0,
refresh : null,
scan: null,
_branch: null,
tree : null,

load : function()
{
    var me = USc_updatescan;
    var r;

    me._extendPlacesTreeView();
    
    me.tree = document.getElementById("updatescan-bookmarks-view");
    me.tree.onclick=me._treeClick;
   
    try {
      var rootFolderId = USc_places.getRootFolderId();
    } catch (e) {
      var rootFolderId = USc_places.createRootFolder();
    }
    me.tree.place = "place:queryType=1&folder=" + rootFolderId;
    
    PlacesUtils.annotations.addObserver(USc_sidebarAnnotationObserver);
    
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
    var me = USc_updatescan;
  
    try { 
      PlacesUtils.annotations.removeObserver(USc_sidebarAnnotationObserver);
    } catch(e) {}
    try {
      me._branch.removeObserver("", this);
    } catch(e) {}
},

// Show/hide menu items depending on whether folder or bookmark is selected
_showMenu : function() 
{
    var me = USc_updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;
    if (USc_places.isFolder(id)) {
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
    var me = USc_updatescan;
    if (aTopic == "nsPref:changed") {
	me._updateToolbar();
    }
},

_treeClick : function(aEvent) {
    var me = USc_updatescan;
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
    var me = USc_updatescan;    
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

    me.scan = new USc_scanner();
    me.numChanges = 0;

    if (me.scan.addItems(USc_places.getRootFolderId(), false) > 0)
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
    var me = USc_updatescan;    

    me._showStopButton();

    me.scan = new USc_scanner();
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
    var me = USc_updatescan;
    if (USc_processScanChange(id, new_content, status, statusText, headerText)) {
        me.numChanges++;
    }
},

_scanEncodingCallback : function(id, encoding)
// Called when encoding is detected for a page marked for auto-detect encoding
{
    USc_places.modifyAnno(id, USc_places.ANNO_ENCODING, encoding);
},

_scanFinishedCallback : function()
{
    var me = USc_updatescan;
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
            me._setStatus(USc_supplant(str.getString("statusManyChanges"), param));
            message = USc_supplant(str.getString("alertManyChanges"), param);
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
  var me = USc_updatescan;
  var id = me._getSelectedItem();
  if (id == undefined)
    me.openNewDialog();
  else if (USc_places.isFolder(id)) 
    me.openNewDialog(id);
  else
    me.openNewDialog(USc_places.getParentFolder(id),
                     USc_places.getIndex(id));
},

openNewDialog : function(parentId, index)
{
    if (typeof parentId == 'undefined' )
      parentId = USc_places.getRootFolderId();
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
        threshold:        USc_defaults.DEF_THRESHOLD,
        scanRateMins:     USc_defaults.DEF_SCAN_RATE_MINS,
        encoding:         USc_defaults.DEF_ENCODING,
        ignoreNumbers:    USc_defaults.DEF_IGNORE_NUMBERS,
        highlightChanges: USc_defaults.DEF_HIGHLIGHT_CHANGES,
        highlightColour:  USc_defaults.DEF_HIGHLIGHT_COLOUR,
        enableScript:     USc_defaults.DEF_ENABLE_SCRIPT,
        enableFlash:      USc_defaults.DEF_ENABLE_FLASH,
        advanced:         false
    };

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgNew', 
                      'chrome,dialog,modal,centrescreen', args);
    if (args.ok) {
        var id = USc_places.addBookmark(args.title, args.url, parentId, index);
        USc_places.modifyAnno(id, USc_places.ANNO_THRESHOLD, args.threshold);
        USc_places.modifyAnno(id, USc_places.ANNO_SCAN_RATE_MINS, args.scanRateMins);
        USc_places.modifyAnno(id, USc_places.ANNO_ENCODING, args.encoding);
        USc_places.modifyAnno(id, USc_places.ANNO_IGNORE_NUMBERS, args.ignoreNumbers);
        USc_places.modifyAnno(id, USc_places.ANNO_HIGHLIGHT_CHANGES, args.highlightChanges);
        USc_places.modifyAnno(id, USc_places.ANNO_HIGHLIGHT_COLOUR, args.highlightColour);
        USc_places.modifyAnno(id, USc_places.ANNO_ENABLE_SCRIPT, args.enableScipt);
        USc_places.modifyAnno(id, USc_places.ANNO_ENABLE_FLASH, args.enableFlash);

        var filebase=USc_places.getSignature(id);
        USc_file.USwriteFile(filebase+".new", "");

        USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, "");
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);
    }
},

openEditDialogForSelected : function()
{
    var me = USc_updatescan;
    var id = me._getSelectedItem();
    me.openEditDialog(id);
},

openEditDialog : function(id)
{
    if (id == undefined)
      return;

    // Launch the folder properties dialog
    if (USc_places.isFolder(id))
    {
         PlacesUIUtils.showItemProperties(id, "folder");
         return;
    }

    var args = {
        title:            USc_places.getTitle(id),
        url:              USc_places.getURL(id),
        threshold:        USc_places.queryAnno(id, USc_places.ANNO_THRESHOLD,
                                               USc_defaults.DEF_THRESHOLD),
        scanRateMins:     USc_places.queryAnno(id, USc_places.ANNO_SCAN_RATE_MINS,
                                               USc_defaults.DEF_SCAN_RATE_MINS),
        encoding:         USc_places.queryAnno(id, USc_places.ANNO_ENCODING,
                                               USc_defaults.DEF_ENCODING),
        ignoreNumbers:    USc_places.queryAnno(id, USc_places.ANNO_IGNORE_NUMBERS,
                                               USc_defaults.DEF_IGNORE_NUMBERS),
        advanced:         false,
        highlightChanges: USc_places.queryAnno(id, USc_places.ANNO_HIGHLIGHT_CHANGES,
                                               USc_defaults.DEF_HIGHLIGHT_CHANGES),
        highlightColour:  USc_places.queryAnno(id, USc_places.ANNO_HIGHLIGHT_COLOUR,
                                               USc_defaults.DEF_HIGHLIGHT_COLOUR),
        enableScript:     USc_places.queryAnno(id, USc_places.ANNO_ENABLE_SCRIPT,
                                               USc_defaults.DEF_ENABLE_SCRIPT),
        enableFlash:      USc_places.queryAnno(id, USc_places.ANNO_ENABLE_FLASH,
                                               USc_defaults.DEF_ENABLE_FLASH)
    };

    var oldurl = args.url;

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgEdit', 
                      'chrome,dialog,modal,centrescreen', args);
                      
    if (args.ok) {
        USc_places.setTitle(id, args.title);
        USc_places.setURL(id, args.url);
        
        USc_places.modifyAnno(id, USc_places.ANNO_THRESHOLD, args.threshold);
        USc_places.modifyAnno(id, USc_places.ANNO_SCAN_RATE_MINS, args.scanRateMins);
        USc_places.modifyAnno(id, USc_places.ANNO_ENCODING, args.encoding);
        USc_places.modifyAnno(id, USc_places.ANNO_IGNORE_NUMBERS, args.ignoreNumbers);
        USc_places.modifyAnno(id, USc_places.ANNO_HIGHLIGHT_CHANGES, args.highlightChanges);
        USc_places.modifyAnno(id, USc_places.ANNO_HIGHLIGHT_COLOUR, args.highlightColour);
        USc_places.modifyAnno(id, USc_places.ANNO_ENABLE_SCRIPT, args.enableScript);
        USc_places.modifyAnno(id, USc_places.ANNO_ENABLE_FLASH, args.enableFlash);

        if (oldurl != args.url) {   // URL changed - reset all values
          // Create a new signature
          USc_places.modifyAnno(id, USc_places.ANNO_SIGNATURE, "");
          var filebase=USc_places.getSignature(id);
          USc_file.USwriteFile(filebase+".new", "");

          USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, "");
          USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);
        }
    }
},

openPreferences : function()
{
    window.openDialog('chrome://updatescan/content/preferences.xul',
                      'dlgUpdatescannerPreferences',
                      'chrome,toolbar,dialog=no,resizable,centerscreen');
},

_diffItem : function(id, delay)
{
    var me = USc_updatescan;

    if (USc_places.isFolder(id))
      return undefined;
    
    var now = new Date();

    me._markAsVisited(id);
    
    var old_lastScan = USc_places.queryAnno(id,
                                            USc_places.ANNO_OLD_LAST_SCAN,
                                            USc_defaults.DEF_OLD_LAST_SCAN);
    old_lastScan = new Date(old_lastScan);

    var oldDate = me._dateDiffString(old_lastScan, now);

    var lastScan = USc_places.queryAnno(id, USc_places.ANNO_LAST_SCAN, USc_defaults.DEF_LAST_SCAN);
    lastScan = new Date(lastScan);
    
    var newDate = me._dateDiffString(lastScan, now);

    if (USc_places.queryAnno(id, USc_places.ANNO_HIGHLIGHT_CHANGES,
                             USc_defaults.DEF_HIGHLIGHT_CHANGES)) {
        var url = ("chrome://updatescan/content/diffPage.xul?id="+escape(id)+
                   "&title="+escape(USc_places.getTitle(id))+
                   "&url="+escape(USc_places.getURL(id))+
                   "&oldDate="+escape(oldDate)+
                   "&newDate="+escape(newDate)+
                   "&delay="+escape(delay));
    } else {
        // Don't highlight - just show the page
        var url = USc_places.getURL(id);
    }

    return url;
},

diffSelectedItemThisWindow : function()
{
    var me = USc_updatescan;
    var item = me._getSelectedItem();
    if (item == undefined)
      return;
    me._diffItemThisWindow(item);
},

_diffItemThisWindow : function(id)
{
    var me = USc_updatescan;
    var diffURL = me._diffItem(id, 0);
    if (diffURL) {
        USc_topWin.open(diffURL);
        if (me.tree) me.tree.focus();    
    }
},

showAllChangesInNewTabs : function()
{
  USc_places.callFunctionWithUpdatedItems(USc_places.getRootFolderId(),
                                          USc_updatescan._diffItemNewTabBackground);
},

diffSelectedFolderNewTab : function()
{
    var me = USc_updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    USc_places.callFunctionWithUpdatedItems(id, USc_updatescan._diffItemNewTab);  
},

diffSelectedItemNewTab : function()
{
    var me = USc_updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    me._diffItemNewTab(id, 0);
},

_diffItemNewTab : function(id, delay)
{
    var me = USc_updatescan;

    var mainWindow = window.QueryInterface(
    Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = me._diffItem(id, delay);
    if (diffURL) {
      mainWindow.getBrowser().selectedTab = mainWindow.getBrowser().addTab(diffURL);
      if (me.tree) me.tree.focus();
    }
},

_diffItemNewTabBackground : function(id, delay)
{
    var me = USc_updatescan;

    var mainWindow = window.QueryInterface(
    Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = me._diffItem(id, delay);
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
            return USc_supplant(str.getString("yesterdayAt"), {time:time});
        } else {
            return USc_supplant(str.getString("todayAt"), {time:time});
        }
    }

    diff = diff / 24;
    if (diff < 7) {
        diff = Math.floor(diff);
        if (diff == 1) {
            return str.getString("dayAgo");
        } else {
            return USc_supplant(str.getString("daysAgo"), {numDays:diff});
        }
    }
    diff = diff / 7;
    diff = Math.floor(diff);
    if (diff == 1) {
        return str.getString("weekAgo");
    } else {
        return USc_supplant(str.getString("weeksAgo"), {numWeeks:diff});
    }
},

markAllAsVisited : function()
{
  USc_places.callFunctionWithUpdatedItems(USc_places.getRootFolderId(),
                                          USc_updatescan._markAsVisited);
},

_markAsVisited : function(id, delay)
{
    if (USc_places.queryAnno(id, USc_places.ANNO_STATUS, "") == USc_places.STATUS_UPDATE)
    {
      USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);      
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

    var helpURL="http://updatescanner.mozdev.org";
    
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
    var me = USc_updatescan;
    if (me.tree.selectedNode)
        return me.tree.selectedNode.itemId;
    else
        return undefined;
},

deleteSelectedItem : function()
// TODO: currently doesn't delete .old and .new files when entire folders are deleted.
{
    var me = USc_updatescan;
    var id = me._getSelectedItem();
    if (id == undefined)
      return;

    try {
        var filebase=USc_places.getSignature(id);

//    if (confirm(str.getString("confirmDelete") + " " + title + "?")) {
        USc_file.USrmFile(filebase+".old");
        USc_file.USrmFile(filebase+".new");
    } catch (ex) { }
    USc_places.deleteBookmark(id);
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
    var me = USc_updatescan;
    var str=document.getElementById("updatescanStrings");
    var param = {title:title};
    me._setStatus(USc_supplant(str.getString("statusScanning"), param));

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
    
	// TODO: remove?
        var isLivemark = (properties.indexOf(this._getAtomFor("livemark")) != -1);
        if (isLivemark) {
            return;
        }
        if (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER ||
            (node.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI &&
             !PlacesUtils.nodeIsLivemarkContainer(node.parent))) {
            try {
                var state = "usc_state_" + PlacesUtils.annotations.getItemAnnotation(node.itemId, USc_places.ANNO_STATUS);
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
    }
},

myDump : function(aMessage) {
    dump(aMessage);
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                         .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("UpdateScan: " + aMessage);
}

};

var USc_sidebarAnnotationObserver = {
  
  onPageAnnotationSet : function(aURI, aName) { },
  
  onItemAnnotationSet : function(aItemId, aName) {
    switch (aName) {
      case USc_places.ANNO_ROOT:
        USc_updatescan.tree.place = "place:queryType=1&folder=" + aItemId;
        break;
      case USc_places.ANNO_STATUS:
        var bx = USc_updatescan.tree.boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject); 
        setTimeout(function(a){a.invalidate();}, 0 ,bx);
        break;
    }
  },
  
  onPageAnnotationRemoved : function(aURI, aName) { },
  
  onItemAnnotationRemoved : function(aItemId, aName) { }
  
};
}
