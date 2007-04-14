const STATUS_NO_CHANGE = 0;
const STATUS_CHANGE    = 1;
const STATUS_ERROR     = 2;
const STATUS_NEW       = 3;

function Scanner()
{
    var me = this;
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
	var page = new item(id, title, url, content, threshold);
	itemlist.push(page);
    }
    
    this.start = function(changedCallbackarg, finishedCallbackarg, 
		       progressCallbackarg)
    {
// Doesn't work now - why not? where is document?
	var treeEmptyAlert="No webpages to scan. Click New to add a page.";
//	var treeEmptyAlert=document.getElementById("strings")
//                                  .getString("treeEmptyAlert");
	changedCallback = changedCallbackarg;
	finishedCallback = finishedCallbackarg;
	progressCallback = progressCallbackarg;
	
	if (itemlist.length == 0)
	{
	    finishedCallback(treeEmptyAlert);
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

	if (httpreq != null && httpreq.readyState == 4) {
	    me.stopTimeout();
	    page = itemlist.shift();      // extract the next item

	    try {
	        if (httpreq.status == 200) {
                    oldContent = stripNonAlphaNum(stripTags(stripScript(page.content)))
		    newContent = stripNonAlphaNum(stripTags(stripScript(
			    	                  httpreq.responseText)));
		    if (!checkSame(newContent, oldContent, page.threshold)) {
		        if (page.content == "**NEW**")
			    changedCallback(page.id, httpreq.responseText, STATUS_NEW);
		        else
			    changedCallback(page.id, httpreq.responseText, STATUS_CHANGE);
		    } else {
		        changedCallback(page.id, "", STATUS_NO_CHANGE);
		    }
	        } else {
		    changedCallback(page.id, "", STATUS_ERROR);
	        }
	    } catch (e) {
		changedCallback(page.id, "", STATUS_ERROR);
	    }
	
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

function item(id, title, url, content, threshold) 
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
	if (threshold < 100)
	    threshold += 10;
	else
	    threshold += 100;

	if (compareFuzzy(content1, content2, threshold))
	    return true;
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

function stripNonAlphaNum(content)
{
    return content.replace(/\W+/g,"");
}
