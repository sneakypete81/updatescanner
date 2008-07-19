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
 * Erik Arvidsson <erik@eae.net>.
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

function FeedLoader() {
  this._listeners = {};
}

FeedLoader.prototype = {
  uri:      null,
  currentFeed:  null,
  loading:    false,

  addListener: function (n, f) {
    var found = false;
    var ls = this._listeners[n];
    if (ls == null) {
      ls = this._listeners[n] = [];
    } else {
      var l = ls.length;
      for (var i = 0; i < l; i++) {
        if (ls[i] == f) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      ls.push(f);
    }
  },

  removeListener: function (n, f) {
    var ls = this._listeners[n];
    if (ls) {
      var l = ls.length;
      for (var i = 0; i < l; i++) {
        if (ls[i] == f) {
          ls.splice(i,1);
          return;
        }
      }
    }
  },

  _callListeners: function (n, arg) {
    var ls = this._listeners[n];
    if (ls) {
      var l = ls.length;
      for (var i = 0; i < l; i++) {
        ls[i].call(this, arg);
      }
    }
  },

  loadURI: function (aURI) {
    if (this.loading) {
      this.abort();
    }

    this.httpReq = new XMLHttpRequest();
    this.httpReq.open("GET", aURI);
    this.uri = aURI;

    var oThis = this;
    this.httpReq.onload = function (e) { return oThis.onHttpLoaded(e); };
    this.httpReq.onerror = function (e) { return oThis.onHttpError(e); };
    this.httpReq.onreadystatechange = function (e) { return oThis.onHttpReadyStateChange(e); };

    try {
      this.httpReq.setRequestHeader("User-Agent", SageUtils.USER_AGENT);
      this.httpReq.overrideMimeType("application/xml");
    } catch (e) {
      this.httpGetResult(SageUtils.RESULT_ERROR_FAILURE);
    }

    try {
      this.httpReq.send(null);
      this.loading = true;
      this.currentFeed = null;
    }
    catch (e) {
      this.httpGetResult(SageUtils.RESULT_ERROR_FAILURE);
    }
  },

  abort: function () {
    if (this.loading) {
      if (this.httpReq) {
        this.httpReq.abort();
      }
      this.httpReq = null;
      this.loading = false;
      this._callListeners("abort", this.uri);
    }
  },

  onHttpError:  function (e)
  {
    var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
    var logger = new Logger();

    logger.warn("HTTP Error: " + e.target.status + " - " + e.target.statusText);
    this.httpGetResult(SageUtils.RESULT_NOT_AVAILABLE);
  },

  onHttpReadyStateChange:  function (e)
  {
    if (this.httpReq.readyState == 2)
    {
      try
      {
        if (this.httpReq.status == 404)
        {
          this.httpGetResult(SageUtils.RESULT_NOT_FOUND);
        }
      }
      catch (e)
      {
        this.httpGetResult(SageUtils.RESULT_NOT_AVAILABLE);
        return;
      }
    }
    //else if (this.httpReq.readyState == 3) {}
  },

  onHttpLoaded:  function (e)
  {
    this.responseXML = this.httpReq.responseXML;
    var rootNodeName = this.responseXML.documentElement.localName.toLowerCase();

    switch (rootNodeName)
    {
      case "parsererror":
        // XML Parse Error
        this.httpGetResult(SageUtils.RESULT_PARSE_ERROR);
        break;
      case "rss":
      case "rdf":
      case "feed":
        this.httpGetResult(SageUtils.RESULT_OK);
        break;
      default:
        // Not RSS or Atom
        this.httpGetResult(SageUtils.RESULT_NOT_RSS);
        break;
    }
  },

  httpGetResult:  function httpGetResult(aResultCode)
  {
    //this.abort();
    this.loading = false;

    if (aResultCode == SageUtils.RESULT_OK)
    {
      var FeedParserFactory = new Components.Constructor("@sage.mozdev.org/sage/feedparserfactory;1", "sageIFeedParserFactory");
      var feedParserFactory = new FeedParserFactory();
      var feedParser = feedParserFactory.createFeedParser(this.responseXML);
      this.currentFeed = feedParser.parse(this.responseXML);
      this.currentFeed.setFeedURI(this.uri);

      this._callListeners("load", this.currentFeed);

    }
    else
    {
      this._callListeners("error", aResultCode);
    }

    // clean up
    this.responseXML = null;
    this.httpReq = null;
  }
};
