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
    var errors;

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
            me.stopTimeout();
            hideProgress();
            httpreq = null;
            me.clear()
        }
    }

    this.startTimeout = function()
    {
        me.stopTimeout();
        scanTimerRunning = true;
        scanTimerID = setTimeout(me.timeout, 10000); // Give it 10 seconds
    }

    this.stopTimeout = function()
    {
        if (scanTimerRunning) {
            clearTimeout(scanTimerID);
            scanTimerRunning = false;
        }
    }

    this.timeout = function()
    {
        if (httpreq) { // Abort the request
            httpreq.abort();
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
        
        errors = "";
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
    
        if (httpreq != null && httpreq.readyState == 4) {
            me.stopTimeout();
            page = itemlist.shift();      // extract the next item
    
            try {
                if (httpreq.status == 200) {
                    oldContent = stripWhitespace(stripTags(stripScript(
                                 page.content)));
                    newContent = stripWhitespace(stripTags(stripScript(
                                 httpreq.responseText)));
                    if (newContent == "" || 
                        checkSame(newContent, oldContent, page.threshold)) {
                        status = STATUS_NO_CHANGE;
                    } else {
                        responseText = httpreq.responseText;
                        if (page.content == "**NEW**") {
                            status = STATUS_NEW;
                        } else {
                            status = STATUS_CHANGE;
                        }
                    }
                } else {
                    status = STATUS_ERROR;
                }
            } catch (e) {
                //myDump(e);
                status = STATUS_ERROR;
            }

            changedCallback(page.id, responseText, status)

            me.getNextPage();
        }
    }

    this.getNextPage = function()
    {
        if (itemlist.length > 0) {
            try {
                httpreq = new XMLHttpRequest();
                httpreq.open("GET", itemlist[0].url,true);
                httpreq.onreadystatechange=me.next;
                httpreq.send(null);
                me.startTimeout();
            } catch (e) {
                me.stopTimeout();
                page = itemlist.shift();      // extract the next item
                changedCallback(page.id, "", STATUS_ERROR);
                currentitem++;
                progressCallback(currentitem, numitems);
                me.getNextPage();
                return;
            }
            currentitem++;
            progressCallback(currentitem, numitems);
        }
        else
        {
            finishedCallback(errors);
            me.clear();
            scanning = false;
            return;
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

function processScanChange(id, newContent, status)
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

    filebase = escapeFilename(id.substr(6));
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
    } else if (status == STATUS_NO_CHANGE) {
	    modifyRDFitem(id, "error", "0");
	    modifyRDFitem(id, "lastscan", now.toString());
    } else if (status == STATUS_NEW) {
	    writeFile(filebase+".dif", newContent);
	    writeFile(filebase+".old", newContent);
	    writeFile(filebase+".new", newContent);
	    modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "old_lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
    } else {
	    modifyRDFitem(id, "error", "1");
    }
	saveRDF();    
    return retVal;
}
