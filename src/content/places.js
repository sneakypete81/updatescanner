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
  ANNO_SIG : "updatscan/signature", // string
  ANNO_LASTVISIT : "updatescan/lastvisit", // Epoch seconds
  ANNO_FEEDTITLE : "updatescan/feedtitle", // string
    
  ORGANIZER_QUERY_ANNO : "PlacesOrganizer/OrganizerQuery",

  NC_NS: "http://home.netscape.com/NC-rdf#",
  XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",

  STATUS_UPDATE: "updated",
  STATUS_NO_UPDATE: "no-updated",
  STATUS_UNKNOWN: "unknown",
  STATUS_ERROR: "error",
  STATUS_CHECKING: "checking",

  addBookmark : function(title, url) {
    var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var bookmarkURI = ioService.newURI(url, null, null);
    var folderId = this.getRootFolderId();
    var id = bookmarksService.insertBookmark(folderId, bookmarkURI, bookmarksService.DEFAULT_INDEX, title);
    annotationService.setItemAnnotation(id, this.ANNO_STATUS, "updated", 0, annotationService.EXPIRE_NEVER);
    return id;
  },

  getRootFolderId : function() {
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
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
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
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

  getURL : function(id)
  {
    return PlacesUtils.bookmarks.getBookmarkURI(id).spec;
  },
  
  getTitle : function(id)
  {
    return PlacesUtils.bookmarks.getItemTitle(id);
  }


/*  
addItem : function()
{
    var me = USc_rdf;
    var node=me.dsource.getAnonymousNode();
    me.rootnode.addChild(node,true);
    me.dsource.save();
    return node.getValue();
},

modifyItem : function(id, field, value)
{
    var me = USc_rdf;
    me.dsource.getNode(id).addTargetOnce(me.namespace+"#"+field, String(value));
},

deleteItem : function(id)
{
    var me = USc_rdf;
    me.dsource.deleteRecursive(id);
},

queryItem : function(id, field, defaultValue)
{
    var me = USc_rdf;
    if (me.targetExists(id, field)) {
        return me.dsource.getNode(id).getTarget(me.namespace+"#"+field).getValue();
    } else {
        return defaultValue;
    }
},

targetExists : function(id, field)
{
    var me = USc_rdf;
    var item;

    item = me.dsource.getNode(id).getTarget(me.namespace+"#"+field);
    if (item == null) {
        return false;
    }
    return true;
},

moveItem : function(id, newIndex)
{
    var me = USc_rdf;
    var item = me.dsource.getNode(id);
    me.rootnode.removeChild(item);
    me.rootnode.addChildAt(item, newIndex+1); //rdfds index starts at 1, not 0
},
*/  
}
}