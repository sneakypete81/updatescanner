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

const STATUS_NO_CHANGE    = 0;
const STATUS_CHANGE       = 1;
const STATUS_ERROR        = 2;
const STATUS_NEW          = 3;
const STATUS_MINOR_CHANGE = 4;

function Scanner()
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
//        myDump("Clear");
        itemlist.length = 0;
    }

    this.cancel = function()
    {
        if (scanning) {
//            myDump("Cancel");
            scanning = false;
            me.stopTimeout();
            hideProgress();
            httpreq = null;
            me.clear()
        }
    }

    this.startTimeout = function()
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
        me.stopTimeout();
//        myDump("Start Timeout:"+scanTimeout);
        scanTimerRunning = true;
        timeoutError = false;
        scanTimerID = setTimeout(me.timeout, scanTimeout*1000);
    }

    this.stopTimeout = function()
    {
//        myDump("Stop Timeout");
        if (scanTimerRunning) {
            clearTimeout(scanTimerID);
            scanTimerRunning = false;
            timeoutError = false;
        }
    }

    this.timeout = function()
    {
        if (httpreq) { // Abort the request - this triggers an error 
//            myDump("timeout");
            timeoutError = true;
            httpreq.abort(); // Triggers this.next with status undefined
//        } else {
//            myDump("Timeout with no httpreq")
        }
    }

    this.addURL = function(id, title, url, content, threshold, 
                           ignoreNumbers, encoding)
    {
        var page = new uscanItem(id, title, url, content, threshold, 
                                 ignoreNumbers, encoding);
        itemlist.push(page);
    }
    
    this.start = function(changedCallbackarg, finishedCallbackarg,
              progressCallbackarg, encodingCallbackarg)
    {
//        myDump("Start");         
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
        progressCallback(currentitem, numitems);
        
        scanning = true;
        me.getNextPage();
    }

    this.next = function()
    {
        var filename;
        var response;
        var page;
        var newContent;
        var status = STATUS_ERROR;
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
            me.stopTimeout();
            page = itemlist.shift();      // extract the next item
    
            try {
                if (httpreqStatus == 200 || httpreqStatus == 0) {
                    // 200 = OK, 0 = FTP/FILE finished
//                    myDump("StatusText="+httpreqStatusText)

                    if (page.encoding == "auto") {
                        // Scan the response for encoding
                        page.encoding = getEncoding(httpreqHeaderText, 
                                                    httpreqResponseText);
                        // If encoding is not defined anywhere, use whatever
                        // the XMLHttpRequest method decided to do.
                   
                        if (page.encoding != "") {
                            encodingCallback(page.id, page.encoding);
                            // Download again with the correct encoding                            
                            itemlist.unshift(page);
                            me.getNextPage();
                            return;
                        }
                    }

                    oldContent = stripWhitespace(stripTags(stripScript(
                                 page.content)));
                    newContent = stripWhitespace(stripTags(stripScript(
                                 httpreqResponseText)));
                    if (page.ignoreNumbers) {
                        oldContent = stripNumbers(oldContent);
                        newContent = stripNumbers(newContent);
                    }
                    if (newContent == "" || page.content == httpreqResponseText) {
//                          myDump("No Change");
                        status = STATUS_NO_CHANGE;
                    } else if (checkSame(newContent, oldContent, page.threshold)) {
//                          myDump("Minor Change");
                          status = STATUS_MINOR_CHANGE;
                    } else {
                        if (page.content == "**NEW**") {
//                            myDump("New");
                            status = STATUS_NEW;
                        } else {
//                            myDump("Change");
                            status = STATUS_CHANGE;
                        }
                    }
                } else {
//                    myDump("Error status="+httpreqStatus);
//                    myDump("StatusText="+httpreqStatusText);                    
                    status = STATUS_ERROR;
                }
            } catch (e) {
//                myDump("Error except="+e);                    
                status = STATUS_ERROR;
            }
            changedCallback(page.id, httpreqResponseText, status, 
                            httpreqStatusText, httpreqHeaderText);
            me.getNextPage();
        }
    }

    this.getNextPage = function()
    {
        var page;
        if (itemlist.length > 0) {
            while (!me.attemptGet(itemlist[0].url, itemlist[0].encoding)) {
                page = itemlist.shift();      // extract the next item
                changedCallback(page.id, "", STATUS_ERROR, 
                    Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://updatescan/locale/updatescan.properties")
                   .GetStringFromName("getError"), "");

                currentitem++;
                progressCallback(currentitem, numitems);
                if (itemlist.length == 0) {
                    finishedCallback();
                    me.clear();
                    scanning = false;
                    return;
                }
            }
            me.startTimeout();
            currentitem++;
            progressCallback(currentitem, numitems);
        }
        else
        {
            finishedCallback();
            me.clear();
            scanning = false;
            return;
        }
    }
    
    this.attemptGet = function(url, encoding)
    {
        try {
//            myDump("Get "+url+" ("+encoding+")")
            httpreq = new XMLHttpRequest();
            httpreq.open("GET", url, true);
            if (encoding != "auto") { 
                // Force parser to use a specific encoding
                httpreq.overrideMimeType('text/html; charset='+encoding);
            }
            httpreq.onreadystatechange=me.next;
            httpreq.send(null);
            return true;
        } catch (e) {
//            myDump("Get Error: "+e)
            return false;
        }        
    }
    
}

function uscanItem(id, title, url, content, threshold, 
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
function checkSame(content1, content2, maxthreshold)
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
        if (compareFuzzy(content1, content2, threshold)) {
            return true;
        }
    }
    return false;
}

function stripTags(content)
{
    return content.replace(/(<([^<]+)>)/g,"");
}

function stripScript(content)
{
    content = content.replace(/<script([\r\n]|.)*?>([\r\n]|.)*?<\/script>/gi,"");
    return    content//.replace(/<script([\r\n]|.)*?\/>/gi,"");
}

function stripWhitespace(content)
{
    return content.replace(/\s+/g,"");
}

function stripNumbers(content)
{
    return content.replace(/[0-9]*/g,"")
}

function getEncoding(header, content)
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

function processScanChange(id, newContent, status, statusText, headerText)
// Updates the specified item based on the new content.
// * Updates RDF tree
// * Writes content to file
// * Performs diff on old content
{
    var now = new Date();
    var filebase;
    var oldLastscan;
    var oldContent;
    var diffContent;
    var retVal = false;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService).
                getBranch("extensions.updatescan.");

    var logHeaders = prefs.getBoolPref("logHeaders");
    
    filebase=escapeFilename(id)
    if (status == STATUS_CHANGE) {
        retVal = true;
	    if (queryRDFitem(id, "changed") == "0") {
            // If this is a new change, save the previous state for diffing
            rmFile(filebase+".old");
            mvFile(filebase+".new", filebase+".old");
            oldLastscan = queryRDFitem(id, "lastscan", "");
            modifyRDFitem(id, "old_lastscan", oldLastscan);
        }

        oldContent  = USreadFile(filebase+".old");
        diffContent = createDiffs(oldContent, newContent);   
        USwriteFile(filebase+".dif", diffContent);
        USwriteFile(filebase+".new", newContent);

	    modifyRDFitem(id, "changed", "1");
        modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
        modifyRDFitem(id, "statusText", statusText);
        if (logHeaders) modifyRDFitem(id, "headerText", headerText);        
    } else if (status == STATUS_MINOR_CHANGE) {
        // Minor change: don't notify, but save new page and diff
        oldContent  = USreadFile(filebase+".old");
        diffContent = createDiffs(oldContent, newContent);   
        USwriteFile(filebase+".dif", diffContent);
        USwriteFile(filebase+".new", newContent);

        modifyRDFitem(id, "error", "0");
        modifyRDFitem(id, "lastscan", now.toString());
        modifyRDFitem(id, "statusText", statusText);
        if (logHeaders) modifyRDFitem(id, "headerText", headerText);        
    } else if (status == STATUS_NO_CHANGE) {
	    modifyRDFitem(id, "error", "0");
	    modifyRDFitem(id, "lastscan", now.toString());
        modifyRDFitem(id, "statusText", statusText);
        if (logHeaders) modifyRDFitem(id, "headerText", headerText);        
    } else if (status == STATUS_NEW) {
	    USwriteFile(filebase+".dif", newContent);
	    USwriteFile(filebase+".old", newContent);
	    USwriteFile(filebase+".new", newContent);
	    modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "old_lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
        modifyRDFitem(id, "statusText", statusText);
        if (logHeaders) modifyRDFitem(id, "headerText", headerText);        
    } else {
	    modifyRDFitem(id, "error", "1");
        modifyRDFitem(id, "statusText", statusText);
        if (logHeaders) modifyRDFitem(id, "headerText", headerText);        
    }
	saveRDF();    
    return retVal;
}
