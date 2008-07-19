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

var sageOverlay = {
  
  logger : null,
  needsRestart : null,

  init : function() {    
//    var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
//    this.logger = new Logger();
        
    this.needsRestart = false;
    
    if (this.isNewUser()) {
      this.createRoot();
      this.addToolbarButton();
      SageUtils.persistValue("chrome://updatescan/content/sage.xul", "chkShowFeedItemList", "checked", true);
      SageUtils.persistValue("chrome://updatescan/content/sage.xul", "chkShowFeedItemListToolbar", "checked", true);
      SageUtils.persistValue("chrome://updatescan/content/sage.xul", "chkShowFeedItemTooltips", "checked", true);
      this.addContentHandler();
      this.needsRestart = true;
    } else if (this.needsMigration()) {
      try {
        this.migrate();
      } catch (e) {
//        this.logger.error("migration failed: " + e);
      }
    }
    SageUtils.setSagePrefValue(SageUtils.PREF_VERSION, SageUtils.VERSION);
    //this.loadFaviconForHandler();
    if (this.needsRestart) {
      var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
      prefService.setBoolPref("browser.sessionstore.resume_session_once", true);
      Cc["@mozilla.org/toolkit/app-startup;1"]
        .getService(Ci.nsIAppStartup)
        .quit(Ci.nsIAppStartup.eForceQuit | Ci.nsIAppStartup.eRestart);
    }
//    SageUpdateChecker.startCheck(SageUtils.getSageRootFolderId());
//    SageUpdateChecker.startTimer();
//    this.logger.info("initialized");
  },
  
  uninit : function() {},
  
  createRoot : function() {
    var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    var folderId = bookmarksService.createFolder(bookmarksService.bookmarksMenuFolder, "Sage Feeds", bookmarksService.DEFAULT_INDEX);
    SageUtils.setSageRootFolderId(folderId);
    SageUtils.addFeed("BBC News | News Front Page | World Edition", "http://news.bbc.co.uk/rss/newsonline_world_edition/front_page/rss091.xml");
    SageUtils.addFeed("Yahoo! News - Sports", "http://rss.news.yahoo.com/rss/sports");
    SageUtils.addFeed("Sage Project News", "http://sage.mozdev.org/rss.xml");
  },
  
  getVersion : function() {
    var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
    var oldVersionString = null;
    try {
      oldVersionString = prefService.getCharPref("sage.last_version");
    } catch (e) { }
    var versionString = SageUtils.getSagePrefValue(SageUtils.PREF_VERSION);
    
    if (oldVersionString != null && versionString == "") {
      return oldVersionString;
    } else if (versionString != "") {
      return versionString;
    }
    return null;
  },
  
  isNewUser : function() {
    if (this.getVersion()) {
      return false;
    }
    return true;
  },
  
  needsMigration : function() {
    var version = this.getVersion();
    if (version) {
      var comparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
      var x = comparator.compare(SageUtils.VERSION, version);
      if (x > 0) {
        return true;
      }
    }
    return false;
  },
  
  migrate : function() {
    var comparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
    var version = this.getVersion();
    if (!version) {
      return;
    }

    var self = this;
    
    var migrations = {

      "1.3.7" : function() {
        self.addToolbarButton();
      },
      
      "1.4" : function() {
        // find sage root or create new one
        var historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
        var bookmarkService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
        var livemarkService = Cc["@mozilla.org/browser/livemark-service;2"].getService(Ci.nsILivemarkService);
        var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
        function findRoot(folderNode) {
          folderNode.containerOpen = true;
          for (var c = 0; c < folderNode.childCount; c++) {
            var child = folderNode.getChild(c);
            if (child.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER &&
              !livemarkService.isLivemark(child.itemId)) {
              if (child.title == "Sage Feeds") {
                rootId = child.itemId;
              } else {
                child.QueryInterface(Ci.nsINavHistoryContainerResultNode);
                findRoot(child);
              }
            }
          }
        }
        var query, result;
        query = historyService.getNewQuery();
        query.setFolders([bookmarkService.bookmarksMenuFolder], 1);
        result = historyService.executeQuery(query, historyService.getNewQueryOptions());
        var rootId = null;
        findRoot(result.root);
        if (rootId) {
          SageUtils.setSageRootFolderId(rootId);
        } else {
          self.createRoot();
        }
        
        // convert feed states and sigs
        function convertFeeds(folderNode) {
          var lastVisit, description, descriptionParts, status;
          folderNode.containerOpen = true;
          for (var c = 0; c < folderNode.childCount; c++) {
            var child = folderNode.getChild(c);
            if (child.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI ||
              (child.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER &&
              livemarkService.isLivemark(child.itemId))) {
              try {
                lastVisit = new Date().getTime();
                annotationService.setItemAnnotation(child.itemId, SageUtils.ANNO_LASTVISIT, lastVisit, 0, annotationService.EXPIRE_NEVER);
                if (!auto_feed_titles) {
                  annotationService.setItemAnnotation(child.itemId, SageUtils.ANNO_FEEDTITLE, "", 0, annotationService.EXPIRE_NEVER);
                }
                description = annotationService.getItemAnnotation(child.itemId, "bookmarkProperties/description");
                descriptionParts = description.split(" ");
                if (descriptionParts.length == 1 || descriptionParts.length == 2) {
                  status = descriptionParts[0];
                  annotationService.setItemAnnotation(child.itemId, SageUtils.ANNO_STATUS, status, 0, annotationService.EXPIRE_NEVER);
                  annotationService.setItemAnnotation(child.itemId, "bookmarkProperties/description", "", 0, annotationService.EXPIRE_NEVER);
                }
              } catch (e) {
//                self.logger.warn("feed state conversion failed: " + e);
              }
            } else if (child.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER &&
              !livemarkService.isLivemark(child.itemId)) {
              child.QueryInterface(Ci.nsINavHistoryContainerResultNode);
              convertFeeds(child);
            }
          }
        }
        query = historyService.getNewQuery();
        query.setFolders([SageUtils.getSageRootFolderId()], 1);
        result = historyService.executeQuery(query, historyService.getNewQueryOptions());
        var auto_feed_titles = true;
        try {
          auto_feed_titles = SageUtils.getPrefValue("sage.auto_feed_title");
        } catch (e) { }
        convertFeeds(result.root);
        
        // copy prefs and delete old ones
        function deletePref(pref) {
          var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
          try {
            prefService.clearUserPref(pref);
          } catch (e) { }
        }
        function movePref(oldPref, sagePref) {
          try {
            var value = SageUtils.getPrefValue(oldPref);
            SageUtils.setSagePrefValue(sagePref, value);
          } catch (e) { }
          deletePref(oldPref);
        }
        deletePref("sage.folder_id");
        deletePref("sage.last_version");
        deletePref("sage.auto_feed_title");
        movePref("sage.user_css.enable", SageUtils.PREF_USER_CSS_ENABLE);
        movePref("sage.user_css.path", SageUtils.PREF_USER_CSS_PATH);
        movePref("sage.allow_encoded_content", SageUtils.PREF_ALLOW_ENCODED_CONTENT);
        movePref("sage.render_feeds", SageUtils.PREF_RENDER_FEEDS);
        movePref("sage.twelve_hour_clock", SageUtils.PREF_TWELVE_HOUR_CLOCK);
        movePref("sage.feed_item_order", SageUtils.PREF_FEED_ITEM_ORDER);
        movePref("sage.feed_discovery_mode", SageUtils.PREF_FEED_DISCOVERY_MODE);
        movePref("sage.log_level", SageUtils.PREF_LOG_LEVEL);
        
        // rename persisted value chkShowTooltip => chkShowFeedItemTooltips
        var RDF = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
        var localstore = RDF.GetDataSource("rdf:local-store");
        if (localstore.HasAssertion(RDF.GetResource("chrome://updatescan/content/sage.xul#chkShowTooltip"), RDF.GetResource("checked"), RDF.GetLiteral(true), true)) {
          SageUtils.persistValue("chrome://updatescan/content/sage.xul", "chkShowFeedItemTooltips", "checked", true);
        } else {
          SageUtils.persistValue("chrome://updatescan/content/sage.xul", "chkShowFeedItemTooltips", "checked", false);
        }
        
        // add content handler
        self.addContentHandler();
        self.needsRestart = true;
      },
      
      "1.5a" : function() {
        self.addContentHandler();
        self.needsRestart = true;
      }
      
    }
    
    for (var migration in migrations) {
      if (comparator.compare(migration, version) > 0) {
//        this.logger.info("performing migration " + migration);
        migrations[migration]();
      }
    }
  },

  hasButton : function() {
    var toolbox = document.getElementById("navigator-toolbox");
    for (var i = 0; i < toolbox.childNodes.length; ++i) {
      var toolbar = toolbox.childNodes[i];
      if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true") {
        if (toolbar.currentSet.indexOf("sage-button") > -1) {
          return true;
        }
        }
      }
  },
  
  addToolbarButton : function() {
    if (!this.hasButton()) {
      var toolbox = document.getElementById("navigator-toolbox");
      for (var i = 0; i < toolbox.childNodes.length; ++i) {
        toolbar = toolbox.childNodes[i];
        if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable") == "true" && toolbar.id == "nav-bar") {
          var newSet = "";
          var child = toolbar.firstChild;
          while (child) {
            if(child.id == "urlbar-container") {
              newSet += "sage-button,";
            }
            newSet += child.id + ",";
            child = child.nextSibling;
          }
          newSet = newSet.substring(0, newSet.length - 1);
          toolbar.currentSet = newSet;
          toolbar.setAttribute("currentset", newSet);
          toolbox.ownerDocument.persist(toolbar.id, "currentset");
          try {
            BrowserToolboxCustomizeDone(true);
          } catch (e) {}
          break;
        }
      }
    }
  },
  
  addContentHandler : function() {
    var prefService = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefService);
    var i = 0;
    var prefBranch = null;
    while (true) {
      prefBranch = prefService.getBranch("browser.contentHandlers.types." + i + ".");
      try {
        var title = prefBranch.getCharPref("title");
        if (title == "Sage") {
          break;
        }
        i++;
      } catch (e) {
        // No more handlers
        break;
      }
    }
    if (prefBranch) {
      prefBranch.setCharPref("title", "Sage");
      prefBranch.setCharPref("type", "application/vnd.mozilla.maybe.feed");
      prefBranch.setCharPref("uri", "sage://viewer/#feed/%s");
    }
    prefService.savePrefFile(null);
  },
  
  loadFaviconForHandler : function() {
    var faviconService = Cc["@mozilla.org/browser/favicon-service;1"].getService(Ci.nsIFaviconService);
    var ioservice = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var pageURI = ioservice.newURI("chrome://updatescan/content/feedsummary.html", null, null);
    var faviconURI = ioservice.newURI("chrome://updatescan/skin/sage_leaf_16.png", null, null);
    faviconService.setAndLoadFaviconForPage(pageURI, faviconURI, false);
  },
  
  // nsIDOMEventListener
  handleEvent: function(event) {
    switch(event.type) {
      case "load":
        this.init();
        break;
      case "unload":
        this.uninit();
        break;
    }
  }

}

window.addEventListener("load", sageOverlay, false);
window.addEventListener("unload", sageOverlay, false);
