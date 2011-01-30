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

var kUSc_STATUS_NO_CHANGE    = 0;
var kUSc_STATUS_CHANGE       = 1;
var kUSc_STATUS_ERROR        = 2;
var kUSc_STATUS_NEW          = 3;
var kUSc_STATUS_MINOR_CHANGE = 4;

function USc_scanner()
{
    var me = this;
    var doc;
    var httpreq;
    var itemlist = new Array();
    var scanning = false;
    var changedCallback;
    var finishedCallback;
    var progressCallback;
    var encodingCallback;
    var timeoutError = false;

    var numitems;
    var currentitem;
    var scanTimerID = null;
    var scanTimerRunning = false;
 
    this.clear = function()
    {
        itemlist.length = 0;
    }

    this.cancel = function()
    {
        if (scanning) {
            scanning = false;
            me._stopTimeout();
            httpreq = null;
            me.clear()
        }
    }

    this._startTimeout = function()
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService).
                    getBranch("extensions.updatescan.");

        var scanTimeout;
        try { 
            scanTimeout = prefs.getIntPref("scanTimeout");
	    } catch (e) {
            scanTimeout = 10;
        }
	    if (scanTimeout < 10) scanTimeout = 10;
        me._stopTimeout();
        scanTimerRunning = true;
        timeoutError = false;
        scanTimerID = setTimeout(function(){me._timeout();}, scanTimeout*1000);
    }

    this._stopTimeout = function()
    {
        if (scanTimerRunning) {
            clearTimeout(scanTimerID);
            scanTimerRunning = false;
            timeoutError = false;
        }
    }

    this._timeout = function()
    {
        if (httpreq) { // Abort the request - this triggers an error 
            timeoutError = true;
            httpreq.abort(); // Triggers this.next with status undefined
        }
    }

    this.addItems = function(id, autoScan)
    {
        var hist = Cc["@mozilla.org/browser/nav-history-service;1"]
                   .getService(Ci.nsINavHistoryService);

        var query = hist.getNewQuery();
        var options = hist.getNewQueryOptions();
        query.setFolders([id], 1);
        var result = hist.executeQuery(query, options);

        // select feeds to be checked, exclude separators and updated feeds
        me.queueItemRecursive(result.root, autoScan);

        return itemlist.length;
    }

    this.queueItemRecursive = function(aResultNode, autoScan)
    {
        var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                    .getService(Ci.nsINavBookmarksService);
        var anno = Cc["@mozilla.org/browser/annotation-service;1"]
                   .getService(Ci.nsIAnnotationService);
        var livemarkService = Cc["@mozilla.org/browser/livemark-service;2"]
                              .getService(Ci.nsILivemarkService);
        
        var itemId = aResultNode.itemId;
        var itemType = bmsvc.getItemType(itemId);

        // Can't handle livemarks yet - mark as error
        if (livemarkService.isLivemark(itemId))
        {
            USc_places.modifyAnno(itemId, USc_places.ANNO_STATUS, USc_places.STATUS_ERROR);
            return;
        }
        
        if (itemType == bmsvc.TYPE_BOOKMARK)
        {
            // If we're autoscanning, only queue the item if it needs scanning
            if (autoScan) {
                var scanRate = USc_places.queryAnno(itemId,
                                                    USc_places.ANNO_SCAN_RATE_MINS,
                                                    USc_defaults.DEF_SCAN_RATE_MINS);
                if (scanRate == 0)
                    return;

                var lastAutoScan = USc_places.queryAnno(itemId,
                                                        USc_places.ANNO_LAST_AUTOSCAN,
                                                        USc_defaults.DEF_LAST_AUTOSCAN);
                var now = new Date();
                lastAutoScan = new Date(lastAutoScan);

                 //do not allow last scan to be in the future
                 if (now - lastAutoScan < 0)
                    lastAutoScan = new Date(USc_defaults.DEF_LAST_AUTOSCAN);

                if (now - lastAutoScan < scanRate*1000*60)
                    return;
                USc_places.modifyAnno(itemId, USc_places.ANNO_LAST_AUTOSCAN,
                                      now.toString());
            }

            var filebase = USc_places.getSignature(itemId);
            me.addURL(itemId,
                      USc_places.getTitle(itemId), 
                      USc_places.getURL(itemId), 
                      USc_file.USreadFile(filebase+".new"),
                      USc_places.queryAnno(itemId, USc_places.ANNO_THRESHOLD, USc_defaults.DEF_THRESHOLD),
                      USc_places.queryAnno(itemId, USc_places.ANNO_IGNORE_NUMBERS, USc_defaults.DEF_IGNORE_NUMBERS),
                      USc_places.queryAnno(itemId, USc_places.ANNO_ENCODING, USc_defaults.DEF_ENCODING));

        } else if (itemType == bmsvc.TYPE_FOLDER) {
            aResultNode.QueryInterface(Components.interfaces.nsINavHistoryContainerResultNode);
            aResultNode.containerOpen = true;
            for (var i = 0; i < aResultNode.childCount; i ++) {
                me.queueItemRecursive(aResultNode.getChild(i), autoScan);
            }
            aResultNode.containerOpen = false;
        }    
    }

    this.addURL = function(id, title, url, content, threshold, 
                           ignoreNumbers, encoding)
    {
        var page = new me._uscanItem(id, title, url, content, threshold, 
                                 ignoreNumbers, encoding);
        itemlist.push(page);
    }
    
    this.start = function(changedCallbackarg, finishedCallbackarg,
              progressCallbackarg, encodingCallbackarg)
    {
        changedCallback = changedCallbackarg;
        finishedCallback = finishedCallbackarg;
        progressCallback = progressCallbackarg;
        encodingCallback = encodingCallbackarg;
        
        if (itemlist.length == 0)
        {
            finishedCallback("");
            return;
        }
       
        numitems = itemlist.length + 1;
        currentitem = 0;
        progressCallback(me._nextTitleText(), currentitem, numitems);
        
        scanning = true;
        me._getNextPage();
    }

    this._next = function()
    {
        var filename;
        var response;
        var page;
        var oldContent;
        var newContent;
        var status = kUSc_STATUS_ERROR;
        var httpreqStatus;
        var httpreqStatusText;
        var httpreqHeaderText;
        var httpreqResponseText;

        if (httpreq != null && httpreq.readyState == 4) {
            try {
                if (timeoutError) throw "TimeoutError"
                httpreqStatus = httpreq.status;
                httpreqStatusText = httpreq.statusText;
                httpreqResponseText = httpreq.responseText;
                httpreqHeaderText = httpreq.getAllResponseHeaders();
                if (httpreqHeaderText == null) httpreqHeaderText = "";
            } catch (e) {
               var strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://updatescan/locale/updatescan.properties");
                httpreqStatus = 99999
                if (timeoutError) {
                    httpreqStatusText = strings.
                                 GetStringFromName("timeoutError");
                } else {
                    httpreqStatusText = strings.
                                 GetStringFromName("unknownError")+" ("+e+")";
                }
                httpreqResponseText = "";
                httpreqHeaderText = "";
            }
            httpreq = null;
            me._stopTimeout();
            page = itemlist.shift();      // extract the next item
    
            try {
                if (httpreqStatus == 200 || httpreqStatus == 0) {
                    // 200 = OK, 0 = FTP/FILE finished

                    if (page.encoding == "auto") {
                        // Scan the response for encoding
                        page.encoding = me._getEncoding(httpreqHeaderText, 
                                                    httpreqResponseText);
                        // If encoding is not defined anywhere, use whatever
                        // the XMLHttpRequest method decided to do.
                   
                        if (page.encoding != "") {
                            encodingCallback(page.id, page.encoding);
                            // Download again with the correct encoding                            
                            itemlist.unshift(page);
                            me._getNextPage();
                            return;
                        }
                    }

                    oldContent = me._stripWhitespace(me._stripTags(me._stripScript(
                                 page.content)));
                    newContent = me._stripWhitespace(me._stripTags(me._stripScript(
                                 httpreqResponseText)));
                    if (page.ignoreNumbers) {
                        oldContent = me._stripNumbers(oldContent);
                        newContent = me._stripNumbers(newContent);
                    }
                    if (newContent == "" || page.content == httpreqResponseText) {
                        status = kUSc_STATUS_NO_CHANGE;
                    } else if (me._checkSame(newContent, oldContent, page.threshold)) {
                          status = kUSc_STATUS_MINOR_CHANGE;
                    } else {
                        if (page.content == "") {
                            status = kUSc_STATUS_NEW;
                        } else {
                            status = kUSc_STATUS_CHANGE;
                        }
                    }
                } else {
                    status = kUSc_STATUS_ERROR;
                }
            } catch (e) {
                status = kUSc_STATUS_ERROR;
            }
            changedCallback(page.id, httpreqResponseText, status, 
                            httpreqStatusText, httpreqHeaderText);
            me._getNextPage();
        }
    }

    this._getNextPage = function()
    {
        var page;
        if (itemlist.length > 0) {
            while (!me._attemptGet(itemlist[0].url, itemlist[0].encoding)) {
                page = itemlist.shift();      // extract the next item
                changedCallback(page.id, "", kUSc_STATUS_ERROR, 
                    Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://updatescan/locale/updatescan.properties")
                   .GetStringFromName("getError"), "");

                currentitem++;
                progressCallback(me._nextTitleText(), currentitem, numitems);
                if (itemlist.length == 0) {
                    finishedCallback();
                    me.clear();
                    scanning = false;
                    return;
                }
            }
            me._startTimeout();
            currentitem++;
            progressCallback(me._nextTitleText(), currentitem, numitems);
        }
        else
        {
            finishedCallback();
            me.clear();
            scanning = false;
            return;
        }
    }
    
    this._attemptGet = function(url, encoding)
    {
        try {
            httpreq = new XMLHttpRequest();
            httpreq.open("GET", url, true);
            if (encoding != "auto") { 
                // Force parser to use a specific encoding
                httpreq.overrideMimeType('text/html; charset='+encoding);
            }
            httpreq.onreadystatechange=me._next;
            httpreq.send(null);
            return true;
        } catch (e) {
            return false;
        }        
    }

    this._uscanItem = function(id, title, url, content, threshold, 
                   ignoreNumbers, encoding) 
    {
        this.id = id;
        this.title = title;
        this.url = url;
        this.content = content;
        this.threshold = threshold;
        this.ignoreNumbers = ignoreNumbers;
        this.encoding = encoding;
    } 

    // Returns true if the content is the same
    // (or within a certain number of characters)
    this._checkSame = function(content1, content2, maxthreshold)
    {
        var threshold;
        if (maxthreshold == 0) return (content1 == content2);
    
        // Slowly increase the threshold until it reaches the maximum
        threshold=0;
        while (threshold < maxthreshold) {
            if (threshold < 100) {
                threshold += 10;
            } else {
                threshold += 100;
            }
            if (USc_fuzzy.compare(content1, content2, threshold)) {
                return true;
            }
        }
        return false;
    }
    
    this._stripTags = function(content)
    {
        return content.replace(/(<([^<]+)>)/g,"");
    }
    
    this._stripScript = function(content)
    {
        content = content.replace(/<script([\r\n]|.)*?>([\r\n]|.)*?<\/script>/gi,"");
        return    content
    }
    
    this._stripWhitespace = function(content)
    {
        return content.replace(/\s+/g,"");
    }
    
    this._stripNumbers = function(content)
    {
        return content.replace(/[0-9\,\.]*/g,"")
    }
    
    this._getEncoding = function(header, content)
    // Searches through the header for Content-Type: text/html; charset=xxxxx
    //
    // If not found, scans content for <META http-equiv="Content-Type" 
    // content="text/html; charset=xxxxx">
    {
        var result;
        result = /content-type[^\n]*charset[^\S\n]*=[^\S\n]*([^\s;]*)/i(header)
        if (result != null) return result[1];
        
        result = /<meta[^>]+charset\s*=\s*([^>"';]+)/i(content)
        if (result != null) return result[1];
        
        return ""
    }
    
    this._nextTitleText = function()
    {
        var item;
        if (itemlist.length == 0) {
            item = "";
        } else {
            item = itemlist[0].title;
//            if (item.length > 15) {
//                item = item.slice(0,14);
//            }
        }
        return item;
    }
}

// This doesn't behave very nicely inside the class, since it is called
// inside callbacks.    
function USc_processScanChange(id, newContent, status, statusText, headerText)
// Updates the specified item based on the new content.
// * Updates Bookmark annotations
// * Writes content to file
{
    var now = new Date();
    var filebase;
    var oldLastscan;
    var oldContent;
    var retVal = false;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService).
                getBranch("extensions.updatescan.");

    var logHeaders = prefs.getBoolPref("logHeaders");
    filebase=USc_places.getSignature(id);
    if (status == kUSc_STATUS_CHANGE) {
        retVal = true;
        if (USc_places.queryAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_UNKNOWN)
                != USc_places.STATUS_UPDATE)
        {
            // If this is a new change, save the previous state for diffing
            USc_file.USrmFile(filebase+".old");
            USc_file.USmvFile(filebase+".new", filebase+".old");
            oldLastscan = USc_places.queryAnno(id, USc_places.ANNO_LAST_SCAN, "");
            USc_places.modifyAnno(id, USc_places.ANNO_OLD_LAST_SCAN, oldLastscan);
        }

        USc_file.USwriteFile(filebase+".new", newContent);

        USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_UPDATE);
        USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, now.toString());
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS_TEXT, statusText);
        if (logHeaders)
            USc_places.modifyAnno(id, USc_places.ANNO_HEADER_TEXT, headerText);        

    } else if (status == kUSc_STATUS_MINOR_CHANGE) {
        // Minor change: don't notify, but save new page
        USc_file.USwriteFile(filebase+".new", newContent);

        // Update status to "no change" if necessary
        if (USc_places.queryAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_UNKNOWN)
                != USc_places.STATUS_UPDATE)
        {
            USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);
        }    
        USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, now.toString());
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS_TEXT, statusText);
        if (logHeaders)
            USc_places.modifyAnno(id, USc_places.ANNO_HEADER_TEXT, headerText);        

    } else if (status == kUSc_STATUS_NO_CHANGE) {
        // Update status to "no change" if necessary
        if (USc_places.queryAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_UNKNOWN)
                != USc_places.STATUS_UPDATE)
        {
            USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);
        }    
        USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, now.toString());
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS_TEXT, statusText);
        if (logHeaders)
            USc_places.modifyAnno(id, USc_places.ANNO_HEADER_TEXT, headerText);        
            
    } else if (status == kUSc_STATUS_NEW) {
        USc_file.USwriteFile(filebase+".old", newContent);
        USc_file.USwriteFile(filebase+".new", newContent);
        USc_places.modifyAnno(id, USc_places.ANNO_LAST_SCAN, now.toString());
        USc_places.modifyAnno(id, USc_places.ANNO_OLD_LAST_SCAN, now.toString());
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_NO_UPDATE);
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS_TEXT, statusText);
        if (logHeaders)
            USc_places.modifyAnno(id, USc_places.ANNO_HEADER_TEXT, headerText);
            
    } else {
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS, USc_places.STATUS_ERROR);
        USc_places.modifyAnno(id, USc_places.ANNO_STATUS_TEXT, statusText);
        if (logHeaders)
            USc_places.modifyAnno(id, USc_places.ANNO_HEADER_TEXT, headerText);        
    }
    return retVal;
}

