const STATUS_NO_CHANGE = 0;
const STATUS_CHANGE    = 1;
const STATUS_ERROR     = 2;
const STATUS_NEW       = 3;

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

    this.addURL = function(id, title, url, content, threshold)
    {
        var page = new uscanItem(id, title, url, content, threshold);
        itemlist.push(page);
    }
    
    this.start = function(changedCallbackarg, finishedCallbackarg,
              progressCallbackarg)
    {
//        myDump("Start");         
        changedCallback = changedCallbackarg;
        finishedCallback = finishedCallbackarg;
        progressCallback = progressCallbackarg;
        
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
        var responseText = "";
        var httpreqStatus;
        var httpreqStatusText;
        var httpreqHeaderText;
        var httpreqResponseText;
    
        if (httpreq != null && httpreq.readyState == 4) {
            try {
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
                                        GetStringFromName("unknownError");
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
                    oldContent = stripWhitespace(stripTags(stripScript(
                                 page.content)));
                    newContent = stripWhitespace(stripTags(stripScript(
                                 httpreqResponseText)));
                    if (newContent == "" || 
                        checkSame(newContent, oldContent, page.threshold)) {
//                        myDump("Same");
                        status = STATUS_NO_CHANGE;
                    } else {
                        responseText = httpreqResponseText;
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
            
            changedCallback(page.id, responseText, status, 
                            httpreqStatusText, httpreqHeaderText);
            me.getNextPage();
        }
    }

    this.getNextPage = function()
    {
        var page;
        if (itemlist.length > 0) {
            while (!me.attemptGet(itemlist[0].url)) {
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
    
    this.attemptGet = function(url)
    {
        try {
//            myDump("Get "+url)
            httpreq = new XMLHttpRequest();
            httpreq.open("GET", url, true);
            httpreq.onreadystatechange=me.next;
            httpreq.send(null);
            return true;
        } catch (e) {
//            myDump("Get Error: "+e)
            return false;
        }        
    }
    
}

function uscanItem(id, title, url, content, threshold) 
{
    this.id = id;
    this.title = title;
    this.url = url;
    this.content = content;
    this.threshold = threshold;
} 

// Returns true if the content is the same
// (or within a certain number of characters)
function checkSame(content1, content2, maxthreshold)
{
    var threshold;
    
    if (maxthreshold == 0)
    return (content1 == content2);

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

        oldContent  = readFile(filebase+".old");
        diffContent = createDiffs(oldContent, newContent);   

        writeFile(filebase+".dif", diffContent);
        writeFile(filebase+".new", newContent);

	    modifyRDFitem(id, "changed", "1");
        modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
        modifyRDFitem(id, "statusText", statusText);
        modifyRDFitem(id, "headerText", headerText);        
    } else if (status == STATUS_NO_CHANGE) {
	    modifyRDFitem(id, "error", "0");
	    modifyRDFitem(id, "lastscan", now.toString());
        modifyRDFitem(id, "statusText", statusText);
        modifyRDFitem(id, "headerText", headerText);       
    } else if (status == STATUS_NEW) {
	    writeFile(filebase+".dif", newContent);
	    writeFile(filebase+".old", newContent);
	    writeFile(filebase+".new", newContent);
	    modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "old_lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
        modifyRDFitem(id, "statusText", statusText);
        modifyRDFitem(id, "headerText", headerText);       
    } else {
	    modifyRDFitem(id, "error", "1");
        modifyRDFitem(id, "statusText", statusText);
        modifyRDFitem(id, "headerText", headerText);       
    }
	saveRDF();    
    return retVal;
}
