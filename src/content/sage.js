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
 * The Original Code is Sage.
 *
 * The Initial Developer of the Original Code is
 * Peter Andrews <petea@jhu.edu>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Peter Andrews <petea@jhu.edu>
 * Erik Arvidsson <erik@eae.net>
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

//Components.utils.import("resource://sage/SageUpdateChecker.jsm");

var bookmarksTree;
var statusBarImage, statusBarLabel;
var rssItemListBox;
var rssTitleLabel;
var rssItemToolTip;

var currentFeed;
var lastItemId;
var sageFolderID = "";
var enableTooltip = true;

var logger;
var livemarkService;
var strRes;
var resultStrArray;
var feedLoader;

var annotationObserver = {
  
  onPageAnnotationSet : function(aURI, aName) { },
  
  onItemAnnotationSet : function(aItemId, aName) {
    switch (aName) {
      case SageUtils.ANNO_ROOT:
        bookmarksTree.place = "place:queryType=1&folder=" + aItemId;
        break;
      case SageUtils.ANNO_STATUS:
        bookmarksTree.getResultView().invalidateAll();
        break;
    }
  },
  
  onPageAnnotationRemoved : function(aURI, aName) { },
  
  onItemAnnotationRemoved : function(aItemId, aName) { }
  
}

var sidebarController = {

  init : function() {
//    var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
//    logger = new Logger();
    
    this._extendPlacesTreeView();
    
    bookmarksTree = document.getElementById("bookmarks-view");
//    statusBarImage = document.getElementById("statusBarImage");
//    statusBarLabel = document.getElementById("statusBarLabel");
//    rssItemListBox = document.getElementById("rssItemListBox");
//    rssTitleLabel = document.getElementById("rssTitleLabel");
//    rssItemToolTip = document.getElementById("rssItemToolTip");
    
    try {
      var sageRootFolderId = SageUtils.getSageRootFolderId();
      bookmarksTree.place = "place:queryType=1&folder=" + sageRootFolderId;
    } catch(e) {
//      logger.error(e);
    }
    
    PlacesUtils.annotations.addObserver(annotationObserver);
    
    livemarkService = Cc["@mozilla.org/browser/livemark-service;2"].getService(Ci.nsILivemarkService);
  
    strRes = document.getElementById("strRes");    
    resultStrArray = new Array(
      strRes.getString("RESULT_OK_STR"),
      strRes.getString("RESULT_PARSE_ERROR_STR"),
      strRes.getString("RESULT_NOT_RSS_STR"),
      strRes.getString("RESULT_NOT_FOUND_STR"),
      strRes.getString("RESULT_NOT_AVAILABLE_STR"),
      strRes.getString("RESULT_ERROR_FAILURE_STR")
    );
      
//    toggleShowFeedItemList();
//    toggleShowFeedItemListToolbar();
/*  
    document.documentElement.controllers.appendController(readStateController);
    readStateController.onCommandUpdate();
    
    feedLoader = new FeedLoader();
    feedLoader.addListener("load", onFeedLoaded);
    feedLoader.addListener("error", onFeedLoadError);
    feedLoader.addListener("abort", onFeedAbort);
    
    linkVisitor.init();
*/  
//    logger.info("sidebar open");
  },
  
  uninit : function() {  
//    feedLoader.abort();
//    SageUpdateChecker.done();
    
    // remove observers
//    linkVisitor.uninit();
    PlacesUtils.annotations.removeObserver(annotationObserver);
        
//    SidebarUtils.clearURLFromStatusBar();
  
//    logger.info("sidebar closed");
  },
  
  _extendPlacesTreeView : function() {
    PlacesTreeView.prototype.getCellPropertiesBase = PlacesTreeView.prototype.getCellProperties;
    PlacesTreeView.prototype.getCellProperties =
    function sage_getCellProperties(aRow, aColumn, aProperties) {
      var properties = this._visibleElements[aRow].properties;
      
      var propertiesBase = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
      this.getCellPropertiesBase(aRow, aColumn, propertiesBase);
      var proptery;
      for (var i = 0; i < propertiesBase.Count(); i++) {
        property = propertiesBase.GetElementAt(i);
        if (property != this._getAtomFor("livemark")) {
          aProperties.AppendElement(propertiesBase.GetElementAt(i));
        }
      }
          
      if (aColumn.id != "title")
        return;
      
      if (!properties) {
        properties = [];
        var node = this._visibleElements[aRow].node;
        var nodeType = node.type;
        var itemId = node.itemId;
        if (nodeType == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI) {
          if (!PlacesUtils.nodeIsLivemarkContainer(node.parent)) {
            try {
              var state = PlacesUtils.annotations.getItemAnnotation(itemId, SageUtils.ANNO_STATUS);
              properties.push(this._getAtomFor("sage_state_" + state));
            } catch (e) { }
          }
        } else if (nodeType == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER) {
          if (PlacesUtils.nodeIsLivemarkContainer(node)) {
            try {
              var state = PlacesUtils.annotations.getItemAnnotation(itemId, SageUtils.ANNO_STATUS);
              properties.push(this._getAtomFor("sage_state_" + state));
            } catch (e) { }
          }
        }
        for (var i = 0; i < properties.length; i++) {
          aProperties.AppendElement(properties[i]);
          this._visibleElements[aRow].properties.push(properties[i]);
        }
      }
    }
    PlacesTreeView.prototype.isContainerBase = PlacesTreeView.prototype.isContainer;
    PlacesTreeView.prototype.isContainer =
    function sage_isContainer(aRow) {
      var baseValue = this.isContainerBase(aRow);
       if (baseValue) {
         var node = this._visibleElements[aRow].node;
         if (PlacesUtils.annotations.itemHasAnnotation(node.itemId, LMANNO_FEEDURI)) {
           return false;
         } else {
           return true;
         }
       } else {
         return false;
       }
    }
    PlacesTreeView.prototype.getImageSrc =
    function sage_getImageSrc(aRow, aColumn) {
      return "";
    }  
  },
    
  bookmarksTreeClick : function(aEvent) {
    if (aEvent.button == 2) {
      return;
    }
    
    var tbo = bookmarksTree.treeBoxObject;
    var row = { }, col = { }, obj = { };
    tbo.getCellAt(aEvent.clientX, aEvent.clientY, row, col, obj);

    if (row.value == -1 || obj.value == "twisty") {
      return;
    }

    this.loadFeedFromNode(bookmarksTree.selectedNode, aEvent);
  },
  
  loadFeedFromNode : function(aNode, aEvent) {
    var nodeType = aNode.type;
    var itemId = aNode.itemId;
    var uri;
    if ((nodeType == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER ||
      nodeType == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER_SHORTCUT) &&
      livemarkService.isLivemark(itemId)) {
      uri = livemarkService.getFeedURI(itemId).spec;
    } else {
      uri = PlacesUtils.bookmarks.getBookmarkURI(itemId).spec;
    }
    
    lastItemId = itemId;
    this.setStatus("loading", strRes.getFormattedString("RESULT_LOADING", [PlacesUtils.bookmarks.getItemTitle(itemId)]));
//    feedLoader.loadURI(uri);
//    if (SageUtils.getSagePrefValue(SageUtils.PREF_RENDER_FEEDS)) {
//      openURI(SageUtils.FEED_SUMMARY_URI + "#feed/" + encodeURIComponent(uri), aEvent);
//    }
  },
  
  checkFeeds : function(aFolderId) {
    var self = this;
//    SageUpdateChecker.onCheck = function(aName, aURL) {
//      self.setStatus("checking", strRes.getFormattedString("RESULT_CHECKING", [aName]));
//    }
//    SageUpdateChecker.onChecked = function(aName, aURL) {
//      self.clearStatus();
//    }
  
/*    if(aFolderId) {
      SageUpdateChecker.startCheck(aFolderId);
    } else {
      SageUpdateChecker.startCheck(SageUtils.getSageRootFolderId());
      SageUpdateChecker.resetTimer();
    }
*/  },
  
  setStatus : function(aClass, aStatus) {
//    statusBarImage.setAttribute("class", aClass);
//    statusBarLabel.value = aStatus;
  },

  clearStatus : function() {
/*    statusBarImage.removeAttribute("class");
    statusBarLabel.value = "";
    if (currentFeed) {
      rssTitleLabel.value = currentFeed.getTitle();
      if (currentFeed.getLink()) {
        rssTitleLabel.tooltipText = currentFeed.getLink();
      } else {
        rssTitleLabel.tooltipText = "";
      }
    }
*/  },

  openDiscoverFeedsDialog : function() {
    openDialog("chrome://updatescan/content/discover_feeds.xul", "sage_discover_feeds", "chrome,centerscreen,modal,close", bookmarksTree);
  },
  
  openSettingsDialog : function() {
    openDialog("chrome://updatescan/content/settings/settings.xul", "", "chrome,centerscreen,modal,close");
  },
  
  openOPMLWizardDialog : function() {
    openDialog("chrome://updatescan/content/opml/opml.xul", "", "chrome,centerscreen,modal,close");
  },
  
  openOrganizeFeedsDialog : function() {
    var query = "SageRoot";
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    var organizer = wm.getMostRecentWindow("Places:Organizer");
    if (!organizer) {
      // No currently open places window, so open one with the specified mode.
      openDialog("chrome://browser/content/places/places.xul", "", "chrome,toolbar=yes,dialog=no,resizable", query);
    }
    else {
      organizer.PlacesOrganizer.selectLeftPaneQuery(query);
      organizer.focus();
    }
  },
  
  openAboutDialog : function() {
    var extensionManager = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
    openDialog("chrome://mozapps/content/extensions/about.xul", "",
      "chrome,centerscreen,modal", "urn:mozilla:item:{a6ca9b3b-5e52-4f47-85d8-cca35bb57596}", extensionManager.datasource);
  }

}


function rssItemListBoxClick(aEvent) {
  if(aEvent.type == "click") {
    if(aEvent.button == 2 || aEvent.originalTarget.localName != "listitem") {
      return;
    }
  } else if(aEvent.type == "keypress") {
    if(aEvent.originalTarget.localName != "listbox") {
      return;
    }
  }

  var listItem = rssItemListBox.selectedItem;
  var feedItem = getFeedItemFromListItem( listItem );

  openURI(feedItem.getLink(), aEvent);
}

function rssTitleLabelClick(aNode, aEvent){
  if(aEvent.button == 2) {
    return;
  }
  openURI(currentFeed.getLink(), aEvent);
}

function getContentBrowser() {
  var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
  var topWindowOfType = windowManager.getMostRecentWindow("navigator:browser");
  if (topWindowOfType) {
    return topWindowOfType.document.getElementById('content');
  }
  return null;
}

function toggleShowFeedItemList() {
  var showFeedItemList = getCheckboxCheck("chkShowFeedItemList");
  document.getElementById("sage-splitter").hidden = !showFeedItemList;
  document.getElementById("rssItemListBoxBox").hidden = !showFeedItemList;
  if(showFeedItemList) setRssItemListBox();
}

function toggleShowFeedItemListToolbar() {
  var showFeedItemListToolbar = getCheckboxCheck("chkShowFeedItemListToolbar");
  document.getElementById("itemListToolbar").hidden = !showFeedItemListToolbar;
  if (showFeedItemListToolbar) readStateController.onCommandUpdate();
}

function setRssItemListBox() {
  if(!currentFeed) return;
  if(document.getElementById("rssItemListBoxBox").hidden) return;

  while(rssItemListBox.getRowCount() != 0) {
    rssItemListBox.removeItemAt(0);
  }

  linkVisitor.clearItems();
  var feedItemOrder = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);
  switch (feedItemOrder) {
    case "chrono": currentFeed.setSort(currentFeed.SORT_CHRONO); break;
    case "source": currentFeed.setSort(currentFeed.SORT_SOURCE); break;
  }

  for(var i = 0; currentFeed.getItemCount() > i; i++) {
    var item = currentFeed.getItem(i);
    var itemLabel;
    if (item.hasTitle()) {
      itemLabel = item.getTitle();
    } else if (item.getTitle()) {
      itemLabel = item.getTitle();
    } else {
      itemLabel = strRes.getString("feed_item_no_title")
    }
    itemLabel = (i+1) + ". " + itemLabel;
    var listItem = rssItemListBox.appendItem(itemLabel, i);
    linkVisitor.addItem(item.getLink(), listItem);
    if(linkVisitor.getVisited(item.getLink())) {
      listItem.setAttribute("visited", "true");
    }
  }

  readStateController.onCommandUpdate();
}

function getCheckboxCheck(element_id) {
  var checkboxNode = document.getElementById(element_id);
  return checkboxNode.getAttribute("checked") == "true";
}

function setCheckbox(element_id, value) {
  var checkboxNode = document.getElementById(element_id);
  checkboxNode.setAttribute("checked", value);
}


function populateToolTip(e) {
  // if setting disabled
  if(!getCheckboxCheck("chkShowFeedItemTooltips")) {
    e.preventDefault();
    return;
  }

  if(document.tooltipNode == rssItemListBox) {
    e.preventDefault();
    return;
  }
  var listItem = document.tooltipNode;
  var feedItemOrder = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);
  switch (feedItemOrder) {
    case "chrono": currentFeed.setSort(currentFeed.SORT_CHRONO); break;
    case "source": currentFeed.setSort(currentFeed.SORT_SOURCE); break;
  }
  if (currentFeed.getItem(listItem.value).hasContent()) {
    var description = SageUtils.htmlToText(currentFeed.getItem(listItem.value).getContent());
    if (description.indexOf("/") != -1) {
      description = description.replace(/\//gm, "/\u200B");
    }
    if (description.length > 400) {
      description = description.substring(0,400) + "...";
    }
  } else {
    description = "";
  }
  rssItemToolTip.title = listItem.label;
  rssItemToolTip.description = description;
}

function onFeedLoaded(aFeed) {
  currentFeed = aFeed;
  
  if (lastItemId) {
    function syncTitle(title) {
      if (PlacesUtils.bookmarks.getItemTitle(lastItemId) != title) {
        PlacesUtils.bookmarks.setItemTitle(lastItemId, title);
      }
    }
    if (PlacesUtils.annotations.itemHasAnnotation(lastItemId, SageUtils.ANNO_FEEDTITLE)) {
      var currentItemTitle = PlacesUtils.bookmarks.getItemTitle(lastItemId);
      var lastFeedTitle = PlacesUtils.annotations.getItemAnnotation(lastItemId, SageUtils.ANNO_FEEDTITLE);
      if (currentItemTitle == lastFeedTitle) {
        syncTitle(aFeed.getTitle());
      }
    } else {
      syncTitle(aFeed.getTitle());
    }

    var now = new Date().getTime();
    PlacesUtils.annotations.setItemAnnotation(lastItemId, SageUtils.ANNO_LASTVISIT, now, 0, PlacesUtils.annotations.EXPIRE_NEVER);
//    SageUpdateChecker.setStatusFlag(lastItemId, SageUtils.STATUS_NO_UPDATE);
    PlacesUtils.annotations.setItemAnnotation(lastItemId, SageUtils.ANNO_SIG, aFeed.getSignature(), 0, PlacesUtils.annotations.EXPIRE_NEVER);
    PlacesUtils.annotations.setItemAnnotation(lastItemId, SageUtils.ANNO_FEEDTITLE, aFeed.getTitle(), 0, PlacesUtils.annotations.EXPIRE_NEVER);
  }

  sidebarController.clearStatus();
  setRssItemListBox();
}

function onFeedLoadError(aErrorCode) {
  sidebarController.setStatus("error", strRes.getFormattedString("RESULT_ERROR", [resultStrArray[aErrorCode]]));
}

function onFeedAbort(sURI) {
//  SageUpdateChecker.setStatusFlag(lastItemId, SageUtils.STATUS_UNKNOWN);
}

// This takes a list item from the rss list box and returns the uri it represents
// this seems a bit inefficient. Shouldn't there be a direct mapping between these?

/**
 * This takes a listitem element and returns the FeedItem it represents
 * @param  oListItem : XULListItem
 * @returns  FeedItem
 */
function getFeedItemFromListItem( oListItem ) {
  var feedItemOrder = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);
  switch (feedItemOrder) {
    case "chrono": currentFeed.setSort(currentFeed.SORT_CHRONO); break;
    case "source": currentFeed.setSort(currentFeed.SORT_SOURCE); break;
  }
  return currentFeed.getItem(oListItem.value);
}

/**
 * Returns "tab", "window" or other describing where to open the URI
 *
 * @param  aEvent : Object  If this is an Event object we check the modifiers.
 *               Otherwise we assume it is a string describing the
 *                          window type.
 * @returns  String
 */
function getWindowType(aEvent) {
  var windowType;
  if (aEvent instanceof Event) {
    // figure out what kind of open we want
    if (aEvent.button == 1 || aEvent.ctrlKey || aEvent.metaKey) // click middle button or ctrl/meta click
      return "tab";
    else if (aEvent.shiftKey)
      return "window";
  }
  return aEvent;
}

/**
 * Create a nsIURI from a string spec
 *
 * @param  spec : String
 * @returns  nsIURI
 */
function newURI(spec) {
  return Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(spec, null, null);
}

/**
 * Opens a link in the same window, a new tab or a new window
 *
 * @param  sURI : String
 * @param  aEvent : Object  If this is an Event object we check the modifiers.
 *               Otherwise we assume it is a string describing the
 *                          window type.
 * @returns  void
 */
function openURI(aURI, aEvent) {
  switch (getWindowType(aEvent)) {
    case "tab":
      getContentBrowser().addTab(aURI);
      break;
    case "window":
      // XXX: This opens the window in the background if using the context menu
      document.commandDispatcher.focusedWindow.open(aURI);
      break;
    default:
      getContentBrowser().loadURI(aURI);
  }
  readStateController.onCommandUpdate();
}

/**
 * This is called by the context menu
 * @param  aEvent : String
 * @returns  void
 */
function openListItem(aEvent) {
  var listItem = document.popupNode;
  var feedItem = getFeedItemFromListItem(listItem);
  listItem.setAttribute("visited", "true");
  openURI(feedItem.getLink(), aEvent);
}

// link visit code based on LinkVisitor.mozdev.org

/*
 * This observes to the link-visited broadcast topic and calls onURIChanged when
 * an URI changed its visited state.
 */
var linkVisitor = {
  _uriFixup : Components.classes["@mozilla.org/docshell/urifixup;1"].getService(Components.interfaces.nsIURIFixup),
  _topic: "link-visited",
  
  setVisited:  function (sURI, bRead) {
    if (!sURI) {
      return;
    }

    // why do we need to fixup the URI?
    var fixupURI = this._getFixupURI(sURI);
    if (fixupURI == null) {
      return;
    }
    if (bRead) {
      if (this._ff08) {
        this._globalHistory.addPage(fixupURI);
      } else {
        // Firefox 1.1 added a forth argument used for the referrer
        this._globalHistory.addURI(fixupURI, false, true, null);
      }
    } else {
      this._browserHistory.removePage(fixupURI);
    }
  },

  getVisited : function (sURI) {
    var fixupURI = this._getFixupURI(sURI);
    if (fixupURI == null)
      return false;
    return this._globalHistory.isVisited(fixupURI);
  },

  _getFixupURI : function (sURI) {
    try {
      return this._uriFixup.createFixupURI(sURI, 0);
    }
    catch (e) {
//      logger.warn("Could not fixup URI: " + sURI);
      return null;
    }
  },

  init : function () {
    // Firefox 0.8 does not support @mozilla.org/browser/global-history;2 or
    // nsIGlobalHistory2
    this._ff08 = !("@mozilla.org/browser/global-history;2" in Components.classes);
    var gh;
    if (this._ff08) {
      gh = Components.classes["@mozilla.org/browser/global-history;1"];
      linkVisitor._globalHistory = gh.getService(Components.interfaces.nsIGlobalHistory);
    } else {
      gh = Components.classes["@mozilla.org/browser/global-history;2"];
      linkVisitor._globalHistory = gh.getService(Components.interfaces.nsIGlobalHistory2);
    }
    linkVisitor._browserHistory = gh.getService(Components.interfaces.nsIBrowserHistory);
    
    // add observer
    var os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    os.addObserver(this, this._topic, false);    
  },
  
  uninit: function () {
    this.clearItems();
    var os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    os.removeObserver(this, this._topic);
    
  },
  
  // nsIObserver
  observe: function (aSubject, aTopic, aData) {
    // subject is an URI
    // data is null
    if (aTopic != this._topic) {
      return;
    }
    
    var uri = aSubject.QueryInterface(Components.interfaces.nsIURI);
    this.onURIChanged(uri.spec)
  },
  
  // mapping from the observer to the rss list items
  _items: {},
  
  clearItems: function () {
    this._items = {};
  },
  
  addItem: function (aURI, aListItem) {
    this._items[aURI] = aListItem;
  },
  
  onURIChanged: function (aURI) {
    if (aURI in this._items) {
      var listItem = this._items[aURI];
      if (this.getVisited(aURI)) {
        listItem.setAttribute("visited", "true");
      } else {
        listItem.removeAttribute("visited");
      }
    }
  }
};


// RSS Item Context Menu

/**
 * This is called before the context menu for the listbox is shown. Here we
 * enabled/disable menu items as well as change the text to correctly reflect
 * the read state
 * @returns  void
 */
function updateItemContextMenu() {
  readStateController.onCommandUpdate();
  document.getElementById("rssMarkAsReadItem").hidden =
    !readStateController.isCommandEnabled("cmd_markasread");
  document.getElementById("rssMarkAsUnreadItem").hidden =
    !readStateController.isCommandEnabled("cmd_markasunread");
}


/**
 * Marks all read or unread
 * @param  bRead : Boolean  Whether to mark as read or unread
 * @returns  void
 */
function markAllReadState(bRead) {
  if (currentFeed) {
    var feedItemOrder = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);
    switch (feedItemOrder) {
      case "chrono": currentFeed.setSort(currentFeed.SORT_CHRONO); break;
      case "source": currentFeed.setSort(currentFeed.SORT_SOURCE); break;
    }

    for (var i = 0; i < currentFeed.getItemCount(); i++) {
      linkVisitor.setVisited(currentFeed.getItem(i).getLink(), bRead);
    }

    var listItem;
    for (var y = 0; y < rssItemListBox.getRowCount(); y++) {
      listItem = rssItemListBox.getItemAtIndex(y);
      if (bRead)
        listItem.setAttribute("visited", "true");
      else
        listItem.removeAttribute("visited");
    }
  }
}


/**
 * This marks the selected items as read/unread. This works with multiple
 * selection as well if we want to enable that in the future.
 * @param  bRead : Boolean    Whether to mark items read or unread
 * @returns  void
 */
function markReadState(bRead) {
  var listItems = rssItemListBox.selectedItems;
  for (var i = 0; i < listItems.length; i++) {
    var listItem = listItems[i];
    var feedItem = getFeedItemFromListItem(listItem);
    var uri = feedItem.getLink();
    if (bRead)
      listItem.setAttribute("visited", "true");
    else
      listItem.removeAttribute("visited");
    linkVisitor.setVisited(uri, bRead);
  }
}

/**
 * This toggles the selected items read state. This works with multiple
 * selection as well if we want to enable that in the future.
 *
 * In Thunderbird, pressing M marks all read on unread based on the first
 * item. This seems more consistent and more useful
 *
 * @returns  void
 */
function toggleMarkAsRead() {
  var listItems = rssItemListBox.selectedItems;
  var read;
  for (var i = 0; i < listItems.length; i++) {
    var listItem = listItems[i];
    var feedItem = getFeedItemFromListItem(listItem);
    var uri = feedItem.getLink();
    if (read == null)
      read = !linkVisitor.getVisited(uri);
    if (read)
      listItem.setAttribute("visited", "true");
    else
      listItem.removeAttribute("visited");
    linkVisitor.setVisited(uri, read);
  }
}


/**
 * This controller object takes care of the commands related to marking feed
 * items as read
 */
var readStateController = {
  supportsCommand : function(cmd) {
    switch (cmd) {
      case "cmd_markasread":
      case "cmd_markasunread":
      case "cmd_toggleread":
      case "cmd_markallasread":
      case "cmd_markallasunread":
        return true;
      default:
        return false;
    }
  },

  isCommandEnabled : function(cmd) {
    var items, feedItem, visited, i;

    if (!getCheckboxCheck("chkShowFeedItemList"))
      return false;

    switch (cmd) {
      // Enable if any items available. A more exact solution is to loop
      // over the item and disable/enable dependiong on whether all items
      // are read/unread. This solution is however too slow to be practical.
      case "cmd_markallasread":
      case "cmd_markallasunread":
        return rssItemListBox.getRowCount() > 0;

      // There is a state where we mark a listitem as visited even though
      // we don't know if the server will respond and therefore the link
      // might be unread in the history and read in the UI. In these cases
      // both mark as read and mark as unread needs to be enabled

      case "cmd_markasread":
        items = rssItemListBox.selectedItems;

        // if we have one non visited we can mark as read
        for (i = 0; i < items.length; i++) {
          feedItem = getFeedItemFromListItem( items[i] );
          visited = linkVisitor.getVisited( feedItem.getLink() );
          if (!visited || items[i].getAttribute("visited") != "true")
            return true;
        }
        return false;

      case "cmd_markasunread":
        items = rssItemListBox.selectedItems;

        // if we have one visited we can mark as unread
        for (i = 0; i < items.length; i++) {
          feedItem = getFeedItemFromListItem( items[i] );
          visited = linkVisitor.getVisited( feedItem.getLink() );
          if (visited || items[i].getAttribute("visited") == "true")
            return true;
        }
        return false;

      case "cmd_toggleread":
        return this.isCommandEnabled("cmd_markasread") ||
             this.isCommandEnabled("cmd_markasunread");
    }

    return false;
  },
  doCommand : function(cmd) {
    switch (cmd) {
      case "cmd_markasread":
        markReadState(true);
        break;

      case "cmd_markasunread":
        markReadState(false);
        break;

      case "cmd_toggleread":
        toggleMarkAsRead();
        break;

      case "cmd_markallasread":
        markAllReadState(true);
        break;

      case "cmd_markallasunread":
        markAllReadState(false);
        break;
    }
    this.onCommandUpdate();
  },

  onCommandUpdate: function () {
    var commands = ["cmd_markasread", "cmd_markasunread",
            "cmd_toggleread",
            "cmd_markallasread", "cmd_markallasunread"];
    for (var i = 0; i < commands.length; i++)
      goSetCommandEnabled(commands[i], this.isCommandEnabled(commands[i]));
  },

  onEvent : function(evt){ }
};
