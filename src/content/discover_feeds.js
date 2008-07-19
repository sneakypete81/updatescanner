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

const Cc = Components.classes;
const Ci = Components.interfaces;

var strRes;
var feedTree;
var dataSource;
var rdf;
var ds;
var rdfService;
var schema;
var document_host;
var bookmarksTree;
var progressMeter;
var fetch_total;
var fetch_done;
var statusDeck;
var statusMessage;
var feeds_found_local;
var feeds_found_external;
var possibleFeeds;
var bmsvc;

var logger;

function init() {

  var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
  logger = new Logger();

  var discoveryMode = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_DISCOVERY_MODE);

  strRes = document.getElementById("strRes");
  statusDeck = document.getElementById("statusDeck");
  statusMessage = document.getElementById("statusMessage");
  progressMeter = document.getElementById("progress");
  feedTree = document.getElementById("feedTree");

  dataSource = Components.classes["@mozilla.org/rdf/datasource;1?name=in-memory-datasource"];
  rdf = Components.classes["@mozilla.org/rdf/rdf-service;1"];

  rdfService = rdf.getService(Components.interfaces.nsIRDFService);

  ds = dataSource.createInstance(Components.interfaces.nsIRDFInMemoryDataSource);
  feedTree.database.AddDataSource(ds);

  schema = "http://sage.mozdev.org/FeedData#";

  ds = ds.QueryInterface(Components.interfaces.nsIRDFDataSource);
  bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);

  var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
  var browserWindow = windowManager.getMostRecentWindow("navigator:browser").document.getElementById("content");

  bookmarksTree = window.arguments[0];

  var current_document = browserWindow.contentDocument;

  document_host = current_document.location.host;
  if(document_host.match(/^www\./i)) {
    document_host = document_host.substring(4, document_host.length);
  }

  possibleFeeds = new Array();

  var links, c;
  // Allowing file: might not seem good but the XMLHttpRequest will prevent
  // access to the file system if needed.
  var uriSchemeRe = /^(http|https|ftp|file):$/;

  links = current_document.getElementsByTagName("a");

  if(discoveryMode == "exhaustive") {
    for(c = 0; c < links.length; c++) {
      if(uriSchemeRe.test(links[c].protocol) && links[c].href.match(/xml$|rss|rdf|atom|feed|syndicate/i)) {
        possibleFeeds[links[c].href] = Array(links[c].href, "implicit");
      }
    }
  } else {
    for(c = 0; c < links.length; c++) {
      if(uriSchemeRe.test(links[c].protocol) &&
          links[c].href.match(/xml$|rss|rdf|atom|feed|syndicate/i) &&
          links[c].host.match(new RegExp(document_host, "i"))) {
        possibleFeeds[links[c].href] = Array(links[c].href, "implicit");
      }
    }
  }

  links = current_document.getElementsByTagName("link");
  for(c = 0; c < links.length; c++) {
    if(links[c].rel == "alternate" && (links[c].type == "text/xml" || links[c].type == "application/atom+xml" || links[c].type == "application/rss+xml")) {
      possibleFeeds[links[c].href] = Array(links[c].href, "explicit");
    }
  }

  fetch_total = 0;
  fetch_done = 0;
  feeds_found_local = 0;
  feeds_found_external = 0;

  for(entry in possibleFeeds) {
    fetch_total++;
  }

  if(fetch_total == 0) {
    progressUpdate();
  }

  logger.info("found " + fetch_total + " potential feed URI(s) in " + current_document.location);

  var httpReq;
  for(entry in possibleFeeds) {
    httpReq = new XMLHttpRequest();
    httpReq.onload = httpLoaded;
    httpReq.onerror = httpError;
    try {
      httpReq.open("GET", possibleFeeds[entry][0], true);
      httpReq.setRequestHeader("User-Agent", SageUtils.USER_AGENT);
      httpReq.overrideMimeType("application/xml");
      httpReq.send(null);
    } catch(e) {
      httpReq.abort();
      progressUpdate();
    }
  }
}

function progressUpdate() {
  fetch_done++;
  progressMeter.value = Math.round((fetch_done/fetch_total) * 100);
  if(fetch_done >= fetch_total) {
    if((feeds_found_local + feeds_found_external) == 0) {
      statusMessage.value = strRes.getString("discovery_status_none_found") + ".";
    } else {
      var message = "";
      if(feeds_found_local > 1) message += feeds_found_local + " " + strRes.getString("discovery_status_site_feeds");
      if(feeds_found_local == 1) message += feeds_found_local + " " + strRes.getString("discovery_status_site_feed");
      if(feeds_found_local > 0 && feeds_found_external > 0) message += " " + strRes.getString("discovery_status_and") + " ";
      if(feeds_found_external > 1) message += feeds_found_external + " " + strRes.getString("discovery_status_external_feeds");
      if(feeds_found_external == 1) message += feeds_found_external + " " + strRes.getString("discovery_status_external_feed");
      statusMessage.value = strRes.getString("discovery_status_discovered") + " " + message + ":";
    }
    statusDeck.selectedIndex = 1;
  }
}

function doAddFeed() {
  var index = feedTree.view.selection.currentIndex;
  if(index != -1) {
    var url, title;
    if (feedTree.columns) { // columns property introduced in Firefox 1.1
      url = feedTree.view.getCellText(index, feedTree.columns.getNamedColumn("url"));
      title = feedTree.view.getCellText(index, feedTree.columns.getNamedColumn("title"));
    } else {
      url = feedTree.view.getCellText(index, "url");
      title = feedTree.view.getCellText(index, "title");
    }
    if(url) {
      if(title == "") {
        title = "No Title";
      }
      var sage_folder = SageUtils.getSageRootFolderId();
      var uri = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(url, null, null);
      bmsvc.insertBookmark(sage_folder, uri, -1, title);
      logger.info("added feed: '" + title + "' " + url);

      // select new feed in sibebar
      var bm_index = bookmarksTree.treeBoxObject.view.rowCount - 1;
      bookmarksTree.treeBoxObject.ensureRowIsVisible(bm_index);
      bookmarksTree.treeBoxObject.view.selection.select(bm_index);
    }
  }
  return true;
}

function doClose() {
  return true;
}

function httpError() {
  progressUpdate();
}

function httpLoaded(e) {
  var httpReq = e.target;
  var uri = httpReq.channel.originalURI;
  try {
    var FeedParserFactory = new Components.Constructor("@sage.mozdev.org/sage/feedparserfactory;1", "sageIFeedParserFactory");
    var feedParserFactory = new FeedParserFactory();
    var feedParser = feedParserFactory.createFeedParser(httpReq.responseXML);
    var feed = feedParser.parse(httpReq.responseXML);
    feed.setFeedURI(uri);
    addDiscoveredFeed(uri, feed);
  } catch(e) {  }
  progressUpdate();
}

function addDiscoveredFeed(uri, feed) {
  var feedClass, lastPubDate, itemCount;
  if(uri.host.match(new RegExp(document_host, "i"))) {  // feed is local
    if(feeds_found_local == 0) {
      //ds.Assert(rdfService.GetResource(schema + "Feeds"), rdfService.GetResource(schema + "child"), rdfService.GetResource(schema + "LocalFeeds"), true);
      //ds.Assert(rdfService.GetResource(schema + "LocalFeeds"), rdfService.GetResource(schema + "Title"), rdfService.GetLiteral("Site Feeds"), true);
      //ds.Assert(rdfService.GetResource(schema + "LocalFeeds"), rdfService.GetResource(schema + "Valuation"), rdfService.GetIntLiteral(1), true);
    }
    feedClass = "Feeds";
    feeds_found_local++;
  } else {  // feed is external
    if(feeds_found_external == 0) {
      ds.Assert(rdfService.GetResource(schema + "Feeds"), rdfService.GetResource(schema + "child"), rdfService.GetResource(schema + "ExternalFeeds"), true);
      ds.Assert(rdfService.GetResource(schema + "ExternalFeeds"), rdfService.GetResource(schema + "Title"), rdfService.GetLiteral(strRes.getString("discovery_external_feeds_category")), true);
      ds.Assert(rdfService.GetResource(schema + "ExternalFeeds"), rdfService.GetResource(schema + "Valuation"), rdfService.GetIntLiteral(0), true);
    }
    feedClass = "ExternalFeeds";
    feeds_found_external++;
  }

  var twelveHourClock = SageUtils.getSagePrefValue(SageUtils.PREF_TWELVE_HOUR_CLOCK);
  lastPubDate = "N/A";
  if(feed.hasLastPubDate()) {
    var formatter = Components.classes["@sage.mozdev.org/sage/dateformatter;1"].getService(Components.interfaces.sageIDateFormatter);
    formatter.setFormat(formatter.FORMAT_SHORT, formatter.ABBREVIATED_TRUE, twelveHourClock ? formatter.CLOCK_12HOUR : formatter.CLOCK_24HOUR);
    lastPubDate = formatter.formatDate(feed.getLastPubDate());
  }
  itemCount = feed.getItemCount();

  // feed valuation
  var valuation = 0;
  if(possibleFeeds[uri.spec][1] == "explicit") valuation += 100;
  if(feedClass == "Feeds") valuation += 10;
  if(feed.hasLastPubDate()) valuation += 1;

  ds.Assert(rdfService.GetResource(schema + feedClass), rdfService.GetResource(schema + "child"), rdfService.GetResource(schema + uri.spec), true);

  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "Title"), rdfService.GetLiteral(feed.getTitle()), true);
  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "Format"), rdfService.GetLiteral(feed.getFormat()), true);
  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "URL"), rdfService.GetLiteral(uri.spec), true);
  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "LastPubDate"), rdfService.GetLiteral(lastPubDate), true);
  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "ItemCount"), rdfService.GetLiteral(itemCount), true);
  ds.Assert(rdfService.GetResource(schema + uri.spec), rdfService.GetResource(schema + "Valuation"), rdfService.GetIntLiteral(valuation), true);

  feedTree.builder.rebuild();

  logger.info("discovered feed: " + uri.spec);
}
