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

var SageUtils = {

  VERSION : "1.5a",
  
  USER_AGENT : "Mozilla/5.0 (Sage)",

  PREF_BRANCH : "extensions.sage.",
  
  PREF_VERSION : "version",
  PREF_USER_CSS_ENABLE : "userCss.enable",
  PREF_USER_CSS_PATH : "userCss.path",
  PREF_ALLOW_ENCODED_CONTENT : "allowEncodedContent",
  PREF_RENDER_FEEDS : "renderFeeds",
  PREF_TWELVE_HOUR_CLOCK : "twelveHourClock",
  PREF_FEED_ITEM_ORDER : "feedItemOrder",
  PREF_FEED_DISCOVERY_MODE : "feedDiscoveryMode",
  PREF_LOG_LEVEL : "logLevel",

  RESULT_OK : 0,
  RESULT_PARSE_ERROR : 1,
  RESULT_NOT_RSS : 2,
  RESULT_NOT_FOUND : 3,
  RESULT_NOT_AVAILABLE : 4,
  RESULT_ERROR_FAILURE : 5,

  FEED_SUMMARY_URI :    "sage://viewer/",

  ANNO_ROOT : "sage/root", // int, a Places itemId
  ANNO_STATUS : "sage/status", // string, as defined in SageUtils (STATUS_*)
  ANNO_SIG : "sage/signature", // string
  ANNO_LASTVISIT : "sage/lastvisit", // Epoch seconds
  ANNO_FEEDTITLE : "sage/feedtitle", // string
    
  ORGANIZER_QUERY_ANNO : "PlacesOrganizer/OrganizerQuery", // Not Sage-specific

  NC_NS: "http://home.netscape.com/NC-rdf#",
  XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",

  STATUS_UPDATE: "updated",
  STATUS_NO_UPDATE: "no-updated",
  STATUS_UNKNOWN: "unknown",
  STATUS_ERROR: "error",
  STATUS_CHECKING: "checking",

  convertCharCodeFrom : function(aString, aCharCode) {
    var UConvID = "@mozilla.org/intl/scriptableunicodeconverter";
    var UConvIF  = Components.interfaces.nsIScriptableUnicodeConverter;
    var UConv = Components.classes[UConvID].getService(UConvIF);

    var tmpString = "";
    try {
      UConv.charset = aCharCode;
      tmpString = UConv.ConvertFromUnicode(aString);
    } catch(e) {
      tmpString = null;
    }
    return tmpString;
  },

  getInnerText : function(aNode) {
    if(!aNode.hasChildNodes()) return "";
    
    var NodeFilter = Components.interfaces.nsIDOMNodeFilter;
  
    var resultArray = new Array();
    var walker = aNode.ownerDocument.createTreeWalker(aNode, NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_TEXT, null, false);
    while(walker.nextNode()) {
      resultArray.push(walker.currentNode.nodeValue);
    }
    return resultArray.join('').replace(/^\s+|\s+$/g, "");
  },

  loadText : function(aURI) {
    var  URI = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURI);
    URI.spec = aURI;
  
    var IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    var channel = IOService.newChannelFromURI(URI);
    var stream  = channel.open();
    var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1'].createInstance(Components.interfaces.nsIScriptableInputStream);
    scriptableStream.init(stream);

    var fileContents = scriptableStream.read(scriptableStream.available());

    scriptableStream.close();
    stream.close();

    return fileContents;
  },

  setPrefValue : function(aPref, aValue) {
    var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
    switch (prefService.getPrefType(aPref)) {
      case Ci.nsIPrefBranch.PREF_INVALID:
        throw "Invalid preference: " + aPref;
      case Ci.nsIPrefBranch.PREF_STRING:
        var string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        string.data = aValue;
        prefService.setComplexValue(aPref, Ci.nsISupportsString, string);
        break;
      case Ci.nsIPrefBranch.PREF_INT:
        aValue = parseInt(aValue);
        prefService.setIntPref(aPref, aValue);
        break;
      case Ci.nsIPrefBranch.PREF_BOOL:
        if (typeof(aValue) == "string") {
          aValue = (aValue == "true");
        }
        prefService.setBoolPref(aPref, aValue);
        break;
    }
  },

  getPrefValue : function(aPref) {
    var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
    var prefValue;
    switch (prefService.getPrefType(aPref)) {
      case Ci.nsIPrefBranch.PREF_INVALID:
        throw "Invalid preference: " + aPref;
      case Ci.nsIPrefBranch.PREF_STRING:
        prefValue = prefService.getComplexValue(aPref, Ci.nsISupportsString).data;
        break;
      case Ci.nsIPrefBranch.PREF_INT:
        prefValue = prefService.getIntPref(aPref);
        break;
      case Ci.nsIPrefBranch.PREF_BOOL:
        prefValue = prefService.getBoolPref(aPref);
        break;
    }
    return prefValue;
  },
  
  setSagePrefValue : function(aSagePref, aValue) {
    this.setPrefValue(this.PREF_BRANCH + aSagePref, aValue);
  },

  getSagePrefValue : function(aSagePref) {
    return this.getPrefValue(this.PREF_BRANCH + aSagePref);
  },
  
  getSageRootFolderId : function() {
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
    var results = annotationService.getItemsWithAnnotation(this.ANNO_ROOT, {});
    var rootFolderId;
    if (results.length == 1) {
      rootFolderId = results[0];
    } else if (results.length == 0) {
      throw "No root folder found";
    } else if (results.length > 1) {
      throw "Multiple root folders found";
    }
    return rootFolderId;
  },
  
  // Set the sage/root annotation to the corresponding folder, as well as
  // PlacesOrganizer/OrganizerQuery. Note that there is no risk to stomp
  // a folder already annotated for Firefox, because Firefox only annotates
  // left pane queries this way. Our UI doesn't allow users to select such
  // queries so no problem.
  setSageRootFolderId : function(folderId) {
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
    var results = annotationService.getItemsWithAnnotation(this.ANNO_ROOT, {});
    if (results.length == 1) {
      if (results[0] != folderId) {
        annotationService.removeItemAnnotation(results[0], this.ANNO_ROOT);
        annotationService.setItemAnnotation(folderId, this.ANNO_ROOT, "Sage Root Folder", 0, annotationService.EXPIRE_NEVER);
        try {
          annotationService.removeItemAnnotation(results[0], this.ORGANIZER_QUERY_ANNO);
        } catch (e) {
          // The annotation didn't exist
        }
        annotationService.setItemAnnotation(folderId, this.ORGANIZER_QUERY_ANNO, "SageRoot", 0, annotationService.EXPIRE_NEVER);
      }
    } else if (results.length == 0) {
      annotationService.setItemAnnotation(folderId, this.ANNO_ROOT, "Sage Root Folder", 0, annotationService.EXPIRE_NEVER);
      annotationService.setItemAnnotation(folderId, this.ORGANIZER_QUERY_ANNO, "SageRoot", 0, annotationService.EXPIRE_NEVER);
    } else if (results.length > 1) {
      throw "Multiple root folders found";
    }
  },
  
  addFeed : function(title, url) {
    var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var bookmarkURI = ioService.newURI(url, null, null);
    var folderId = this.getSageRootFolderId();
    var id = bookmarksService.insertBookmark(folderId, bookmarkURI, bookmarksService.DEFAULT_INDEX, title);
    annotationService.setItemAnnotation(id, this.ANNO_STATUS, "updated", 0, annotationService.EXPIRE_NEVER);
  },
  
  persistValue : function(uri, id, attribute, value) {
    var RDF = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    var localstore = RDF.GetDataSource("rdf:local-store");
    localstore.Assert(RDF.GetResource(uri), RDF.GetResource("http://home.netscape.com/NC-rdf#persist"), RDF.GetResource(uri + "#" + id), true);
    localstore.Assert(RDF.GetResource(uri + "#" + id), RDF.GetResource(attribute), RDF.GetLiteral(value), true);
  },
  
  htmlToText : function(aStr) {
    var  formatConverter = Cc["@mozilla.org/widget/htmlformatconverter;1"].createInstance(Ci.nsIFormatConverter);
    var fromStr = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
    fromStr.data = aStr;
    var toStr = { value: null };
  
    try {
      formatConverter.convert("text/html", fromStr, fromStr.toString().length, "text/unicode", toStr, {});
    } catch(e) {
      return aStr;
    }
    if (toStr.value) {
      toStr = toStr.value.QueryInterface(Components.interfaces.nsISupportsString);
      return toStr.toString();
    }
    return aStr;
  }

}
