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

function CreateHtml() {
  this.HTML_SOURCE = SageUtils.loadText("chrome://updatescan/content/res/template-html.txt");
  this.ITEM_SOURCE = SageUtils.loadText("chrome://updatescan/content/res/template-item.txt");
    
  this.unescapeHtmlService = Cc["@mozilla.org/feed-unescapehtml;1"].getService(Ci.nsIScriptableUnescapeHTML);
  this.domParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
  this.xmlSerializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
  
  var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
  this.logger = new Logger();
}

CreateHtml.prototype = {

  renderFeed : function(feed) {
    var self = this;
    var html = this.HTML_SOURCE.replace(/\*\*[^\*]+\*\*/g, function (s) { return self.replaceFeedKeyword(feed, s); });
    var doc = this.domParser.parseFromString("<div class=\"feed\"/>", "application/xhtml+xml");
    var fragment = this.unescapeHtmlService.parseFragment(html, false, null, doc.documentElement);
    doc.documentElement.appendChild(fragment);
    return this.xmlSerializer.serializeToString(doc);
  },

  replaceFeedKeyword : function(feed, s) {
    var footer;

    switch (s) {
      case "**LINK**":
        return feed.getLink();
        break;

      case "**TITLE**":
        return this.entityEncode(feed.getTitle());

      case "**AUTHOR**":
        if (feed.hasAuthor()) {
          return "<div class=\"feed-author\">" + this.entityEncode(feed.getAuthor()) + "</div>";
        }
        return "";

      case "**DESCRIPTION**":
        if (feed.hasDescription()) {
          return feed.getDescription();
        }
        return "";

      case "**ITEMS**":
        return this.getItemsHtml(feed);
    }

    return s;
  },

  getItemsHtml : function(feed) {
    var feedItemOrder = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);
    switch (feedItemOrder) {
      case "chrono": feed.setSort(feed.SORT_CHRONO); break;
      case "source": feed.setSort(feed.SORT_SOURCE); break;
    }
    var sb = [];
    for (var i = 0; i < feed.getItemCount(); i++) {
      sb.push(this.getItemHtml(feed, feed.getItem(i), i));
    }
    return sb.join("");
  },

  getItemHtml : function(feed, item, i) {
    var self = this;
    return  this.ITEM_SOURCE.replace(/\*\*[^\*]+\*\*/g, function (s) {
      return self.replaceFeedItemKeyword(feed, item, i, s);
    });
  },

  replaceFeedItemKeyword : function(feed, item, i, s) {
    switch (s) {
      case "**NUMBER**":
        return i + 1;

      case "**LINK**":
        return item.getLink();

      case "**TITLE**":
        if (item.hasTitle()) {
          return this.entityEncode(item.getTitle());
        } else if (item.getTitle()) {
          return this.entityEncode(item.getTitle());
        } else {
          return this.entityEncode(strRes.GetStringFromName("feed_item_no_title"));
        }

      case "**CONTENT**":
        if (item.hasContent()) {
          var allowEncodedContent = SageUtils.getSagePrefValue(SageUtils.PREF_ALLOW_ENCODED_CONTENT);
          var addClass = "";
          var content = item.getContent();
          if (!allowEncodedContent) {
            content = SageUtils.htmlToText(content);
            addClass = " text";
          }
          return "<div class=\"item-desc" + addClass + "\">" + content + "</div>";
        }
        return "";

      case "**ENCLOSURE**":
        if (item.hasEnclosure()) {
          var enc = item.getEnclosure();
          function createDescriptionFromURL(url) {
            var array = url.split("/");
            var description = "";
            if (array.length > 0) {
              description = array[array.length - 1];
            }
            return description;
          }
          return "<div class=\"item-enclosure\">" +
            "<a href=\"" + enc.getLink() + "\" title=\"" +
            strRes.GetStringFromName("feed_summary_enclosure") +
            "\"><img src=\"" +
              (enc.hasMimeType() ?
                "moz-icon://dummy?size=16&contentType=" + enc.getMimeType() :
                "chrome://updatescan/skin/enclosure.png") +
            "\">" +
            (enc.getDescription() ? enc.getDescription() + ", " : createDescriptionFromURL(enc.getLink())) +
            "</a>" +
            (enc.hasLength() ? " (" + this.formatFileSize(enc.getLength()) + ")" : "") +
            "</div>";
        }
        return "";

      case "**PUBDATE**":
        if (item.hasPubDate()) {
          var twelveHourClock = SageUtils.getSagePrefValue(SageUtils.PREF_TWELVE_HOUR_CLOCK);
          var formatter = Cc["@sage.mozdev.org/sage/dateformatter;1"].getService(Ci.sageIDateFormatter);
          formatter.setFormat(formatter.FORMAT_LONG, formatter.ABBREVIATED_FALSE, twelveHourClock ? formatter.CLOCK_12HOUR : formatter.CLOCK_24HOUR);
          var dateString = formatter.formatDate(item.getPubDate());
          return "<div class=\"item-pubDate\">" + dateString + "</div>";
        }
        return "";

      case "**AUTHOR**":
        if (item.hasAuthor()) {
          return "<div class=\"item-author\">" + this.entityEncode(item.getAuthor()) + "</div>";
        }
        return "";
    }

    return s;
  },
  
  sanitizeContent : function(document) {
    var walker = document.createTreeWalker(document.documentElement, Ci.nsIDOMNodeFilter.SHOW_ELEMENT, null, false);
    node = walker.nextNode();
    while (node) {
      node = walker.nextNode();
    }
  },
  
  formatFileSize : function(n) {
    if (n > 1048576) {
      return Math.round(n / 1048576) + " MB";
    } else if (n > 1024) {
      return Math.round(n / 1024) + " KB";
    } else {
      return n + " B";
    }
  },
  
  entityEncode : function(aStr) {
    function replacechar(match) {
      if (match=="<")
        return "&lt;";
      else if (match==">")
        return "&gt;";
      else if (match=="\"")
        return "&quot;";
      else if (match=="'")
        return "&#039;";
      else if (match=="&")
        return "&amp;";
      else
        return match;
    }
    var re = /[<>"'&]/g;
    return aStr.replace(re, function(m) { return replacechar(m) });
  }

};
