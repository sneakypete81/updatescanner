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

if (typeof(USc_places_exists) != 'boolean') {
var USc_places_exists = true;
var USc_places = {    

  ANNO_ROOT : "updatescan/root", // int, a Places itemId
  ANNO_STATUS : "updatescan/status", // string
  ANNO_ENCODING : "updatescan/encoding", // string
  ANNO_THRESHOLD: "updatescan/threshold", // int
  ANNO_IGNORE_NUMBERS : "updatescan/ignore_numbers", // boolean
  ANNO_LAST_SCAN : "updatescan/last_scan", // string
  ANNO_OLD_LAST_SCAN : "updatescan/old_last_scan", // string
  ANNO_STATUS_TEXT : "updatescan/status_text", // string
  ANNO_SCAN_RATE_MINS : "updatescan/scan_rate_mins", //string
  ANNO_HEADER_TEXT : "updatescan/header_text", // string
  ANNO_SIGNATURE : "updatescan/signature", // string

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
      myDump("Root folder not found")
      rootFolderId = null;
    } else if (results.length > 1) {
      throw "Multiple root folders found";
    }
    return rootFolderId;
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
    if (results.length == 1) {
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
    } else if (results.length == 0) {
      annotationService.setItemAnnotation(folderId, this.ANNO_ROOT, "Update Scanner Root Folder", 0, annotationService.EXPIRE_NEVER);
      annotationService.setItemAnnotation(folderId, this.ORGANIZER_QUERY_ANNO, "UpdatescanRoot", 0, annotationService.EXPIRE_NEVER);
    } else if (results.length > 1) {
      throw "Multiple root folders found";
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
    uri = ioService.newURI(url, null, null);
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
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    annotationService.setItemAnnotation(id, anno, value, 0, annotationService.EXPIRE_NEVER);
  },

  queryAnno : function(id, anno, defaultValue)
  {
    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
    if (annotationService.itemHasAnnotation(id, anno)) {
      return annotationService.getItemAnnotation(id, anno);
    } else {
      return defaultValue;
    }
  },

  getSignature : function(id)
  {
    var sig = this.queryAnno(id, this.ANNO_SIGNATURE, "");
    if (sig == "")
    {
      sig = USc_file.escapeFilename(this.createSignature(id));
      this.modifyAnno(id, this.ANNO_SIGNATURE, sig)
    }
    
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
    var now = new Date();
    
    // build string to be hashed (URL+date/time)
    var str = this.getURL(id) + now.getTime();

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
    var hexHash = [this.toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
    
    return hexHash;
  },

  // return the two-digit hexadecimal code for a byte
  toHexString : function(charCode)
  {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  
  
}
}