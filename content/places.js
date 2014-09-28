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

UpdateScanner.Places = {

  ANNO_ROOT : "updatescan/root", // int, a Places itemId
  ANNO_STATUS : "updatescan/status", // string
  ANNO_ENCODING : "updatescan/encoding", // string
  ANNO_THRESHOLD: "updatescan/threshold", // int
  ANNO_IGNORE_NUMBERS : "updatescan/ignore_numbers", // boolean
  ANNO_LAST_SCAN : "updatescan/last_scan", // string
  ANNO_OLD_LAST_SCAN : "updatescan/old_last_scan", // string
  ANNO_LAST_AUTOSCAN : "updatescan/last_autoscan", // string
  ANNO_STATUS_TEXT : "updatescan/status_text", // string
  ANNO_SCAN_RATE_MINS : "updatescan/scan_rate_mins", //string
  ANNO_HEADER_TEXT : "updatescan/header_text", // string
  ANNO_SIGNATURE : "updatescan/signature", // string
  ANNO_HIGHLIGHT_CHANGES : "updatescan/highlight_changes", // boolean
  ANNO_HIGHLIGHT_COLOUR : "updatescan/highlight_colour", // string
  ANNO_ENABLE_SCRIPT : "updatescan/enable_script", // boolean
  ANNO_ENABLE_FLASH : "updatescan/enable_flash", // boolean

  ORGANIZER_QUERY_ANNO : "PlacesOrganizer/OrganizerQuery",

  NC_NS: "http://home.netscape.com/NC-rdf#",
  XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",

  STATUS_UPDATE: "updated",
  STATUS_NO_UPDATE: "no-updated",
  STATUS_UNKNOWN: "unknown",
  STATUS_ERROR: "error",
  STATUS_CHECKING: "checking",

  getRootFolderId : function() {
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].
                            getService(Components.interfaces.nsIAnnotationService);
    var results = annotationService.getItemsWithAnnotation(this.ANNO_ROOT, {});
    var rootFolderId;
    if (results.length == 1) {
      rootFolderId = results[0];
    } else if (results.length == 0) {
      throw "Root folder not found";
    } else if (results.length > 1) {
      UpdateScanner.Updatescan.myDump("Updatescan warning: Multiple root folders found");
      rootFolderId = results[0];
      annotationService.removeItemAnnotation(results[1], this.ANNO_ROOT);
    }

    return rootFolderId;
  },

  createRootFolder : function() {
    var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
                            getService(Ci.nsINavBookmarksService);
    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");
    var folderName = strings.GetStringFromName("rootFolderName");

    // First see if there's an existing folder with that name
    var folderId = this.findFolderId(folderName);
    if (folderId == null) {
      // If not, create it
      var folderId = bookmarksService.
                      createFolder(bookmarksService.bookmarksMenuFolder,
                                   folderName,
                                   bookmarksService.DEFAULT_INDEX);
    }
    UpdateScanner.Places.setRootFolderId(folderId);
    return folderId;
  },

  findFolderId : function(name) {
    var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
                                   .getService(Components.interfaces.nsINavHistoryService);
    var options = historyService.getNewQueryOptions();
    var query = historyService.getNewQuery();

    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                                     .getService(Components.interfaces.nsINavBookmarksService);
    var bookmarksMenuFolder = bookmarksService.bookmarksMenuFolder;

    query.setFolders([bookmarksMenuFolder], 1);

    var result = historyService.executeQuery(query, options);
    var rootNode = result.root;
    rootNode.containerOpen = true;

    // iterate over the immediate children of this folder
    for (var i = 0; i < rootNode.childCount; i ++) {
      var node = rootNode.getChild(i);
      if (node.title == name) {
        rootNode.containerOpen = false;
        return node.itemId;
      }
    }

    // close a container after using it!
    rootNode.containerOpen = false;
    return null;
  },

  // Set the updatescan/root annotation to the corresponding folder, as well as
  // PlacesOrganizer/OrganizerQuery. Note that there is no risk to stomp
  // a folder already annotated for Firefox, because Firefox only annotates
  // left pane queries this way. Our UI doesn't allow users to select such
  // queries so no problem.
  setRootFolderId : function(folderId) {
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].
                            getService(Components.interfaces.nsIAnnotationService);
    var results = annotationService.getItemsWithAnnotation(this.ANNO_ROOT, {});
    if (results.length == 0) {
      annotationService.setItemAnnotation(folderId, this.ANNO_ROOT, "Update Scanner Root Folder", 0, annotationService.EXPIRE_NEVER);
    } else {
      if (results[0] != folderId) {
        annotationService.removeItemAnnotation(results[0], this.ANNO_ROOT);
        annotationService.setItemAnnotation(folderId, this.ANNO_ROOT, "Update Scanner Root Folder", 0, annotationService.EXPIRE_NEVER);
        try {
          annotationService.removeItemAnnotation(results[0], this.ORGANIZER_QUERY_ANNO);
        } catch (e) {
          // The annotation didn't exist
        }
        annotationService.setItemAnnotation(folderId, this.ORGANIZER_QUERY_ANNO, "UpdatescanRoot", 0, annotationService.EXPIRE_NEVER);
      }
    }
  },

  addBookmark : function(title, url, parentFolder, index) {
    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    if (typeof parentFolder == 'undefined') {
      parentFolder = this.getRootFolderId();
    }
    if (typeof index == 'undefined') {
      index = bookmarksService.DEFAULT_INDEX;
    }
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var bookmarkURI = ioService.newURI(url, null, null);
    var id = bookmarksService.insertBookmark(parentFolder, bookmarkURI, index, title);
    return id;
  },

  deleteBookmark : function(id) {
    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    bookmarksService.removeItem(id);
  },

  getURL : function(id)
  {
    return PlacesUtils.bookmarks.getBookmarkURI(id).spec;
  },

  setURL : function(id, url)
  {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    var uri = ioService.newURI(url, null, null);
    bookmarksService.changeBookmarkURI(id, uri);
  },

  getTitle : function(id)
  {
    return PlacesUtils.bookmarks.getItemTitle(id);
  },

  setTitle : function(id, title)
  {
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    bmsvc.setItemTitle(id, title);
  },

  modifyAnno : function(id, anno, value)
  {
    // Don't update if it's already set to desired value
    if (this.queryAnno(id, anno, undefined) == value) {
      return;
    }
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    annotationService.setItemAnnotation(id, anno, value, 0, annotationService.EXPIRE_NEVER);
  },

  queryAnno : function(id, anno, defaultValue)
  {
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    try {
        if (annotationService.itemHasAnnotation(id, anno)) {
            return annotationService.getItemAnnotation(id, anno);
        } else {
            return defaultValue;
        }
    } catch (e) { // The annotation didn't exist
        return defaultValue;
    }
  },

  removeAnno : function(id, anno)
  {
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    if (annotationService.itemHasAnnotation(id, anno)) {
        annotationService.removeItemAnnotation(id, anno);
    }
  },

  getSignature : function(id)
  {
    var sig = this.createSignature(id);
    this.modifyAnno(id, this.ANNO_SIGNATURE, sig)

    return sig;
  },

  getIndex : function(id)
  {
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);
    return bmsvc.getItemIndex(id);
  },

  getParentFolder : function(id)
  {
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);

    return bmsvc.getFolderIdForItem(id);
  },

  isFolder : function(id)
  {
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);

    return bmsvc.getItemType(id) == bmsvc.TYPE_FOLDER;
  },

  createSignature : function(id)
  {
    // build string to be hashed (URL+id)
    var str = this.getURL(id) + id;

    var converter =
      Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

    // we use UTF-8 here, you can choose other encodings.
    converter.charset = "UTF-8";
    // result is an out parameter,
    // result.value will contain the array length
    var result = {};
    // data is an array of bytes
    var data = converter.convertToByteArray(str, result);
    var ch = Components.classes["@mozilla.org/security/hash;1"]
                       .createInstance(Components.interfaces.nsICryptoHash);
    ch.init(ch.MD5);
    ch.update(data, data.length);
    var hash = ch.finish(false);

    // convert the binary hash data to a hex string.
    var hexHash = ""
    for (var i=0; i<hash.length; i++) {
      hexHash += this.toHexString(hash.charCodeAt(i))
    }
    return hexHash;
  },

  // Update the status annotation of the item's parent
  updateFolderStatus : function (folderId)
  {
    var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
                                   .getService(Components.interfaces.nsINavHistoryService);
    var options = historyService.getNewQueryOptions();
    var query = historyService.getNewQuery();

    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                                     .getService(Components.interfaces.nsINavBookmarksService);

    query.setFolders([folderId], 1);
    var result = historyService.executeQuery(query, options);
    var rootNode = result.root;

    // iterate over the immediate children of this folder and dump to console
    rootNode.containerOpen = true;
    var childrenUpdated = false;

    for (var i = 0; i < rootNode.childCount; i ++) {
      var node = rootNode.getChild(i);
      var status = this.queryAnno(node.itemId, this.ANNO_STATUS, this.STATUS_UNKNOWN);
      if (status == this.STATUS_UPDATE) {
        childrenUpdated = true;
        break;
      }
    }
    rootNode.containerOpen = false;
    if (childrenUpdated) {
      this.modifyAnno(folderId, this.ANNO_STATUS, this.STATUS_UPDATE);
    } else {
      this.modifyAnno(folderId, this.ANNO_STATUS, this.STATUS_NO_UPDATE);
    }
  },

  callFunctionWithUpdatedItems : function(rootId, callback)
  // Look for updated items below rootId, and pass each id and delay
  // to the callback
  {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
    prefs = prefs.getBranch("extensions.updatescan.");

    var hist = Components.classes["@mozilla.org/browser/nav-history-service;1"]
               .getService(Components.interfaces.nsINavHistoryService);

    var query = hist.getNewQuery();
    var options = hist.getNewQueryOptions();
    query.setFolders([rootId], 1);
    var result = hist.executeQuery(query, options);

    this._current_delay = 0;
    this._delay_increment = prefs.getIntPref("newTabDelay");

    UpdateScanner.Places._callFunctionRecursive(result.root, callback);
  },

  _callFunctionRecursive : function(aResultNode, callback)
  // If the node is not updated, don't do anything.
  // If the node is a bookmark, call the callback with its ID and delay, and
  //      increment current_delay by delay_increment
  // If the node is a folder, recurse.
  {
    var itemId = aResultNode.itemId;
    var status = UpdateScanner.Places.queryAnno(itemId, UpdateScanner.Places.ANNO_STATUS, UpdateScanner.Places.STATUS_NO_UPDATE);
    if (status != UpdateScanner.Places.STATUS_UPDATE) {
      return;
    }
    var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                .getService(Components.interfaces.nsINavBookmarksService);

    var itemType = bmsvc.getItemType(itemId);
    if (itemType == bmsvc.TYPE_BOOKMARK)
    {
        callback(itemId, this._current_delay);
        this._current_delay += this._delay_increment;

    } else if (itemType == bmsvc.TYPE_FOLDER) {
      aResultNode.QueryInterface(Components.interfaces.nsINavHistoryContainerResultNode);
      aResultNode.containerOpen = true;
      for (var i = 0; i < aResultNode.childCount; i ++) {
        UpdateScanner.Places._callFunctionRecursive(aResultNode.getChild(i), callback);
        }
        aResultNode.containerOpen = false;
    }
  },

  // return the two-digit hexadecimal code for a byte
  toHexString : function(charCode)
  {
    return ("0" + charCode.toString(16)).slice(-2);
  },
};