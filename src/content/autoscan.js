function Autoscan()
{
    var auto = this;
    var checkTimerRunning = false;
    var checkTimerID = null;
    var scan = null;
    var numChanges;
    var callback;

    // Start checking if scanning is required every minute
    this.start = function(callbackarg)
    {
	callback = callbackarg;
	if (checkTimerRunning)
	    auto.stop();
	checkTimerID = setInterval(auto.check, 60*1000);
	checkTimerRunning = true;

	auto.check();
    }

    // Stop checking
    this.stop = function()
    {
	callback=null;
	clearInterval(checkTimerID);
	checkTimerRunning = false;
    }

    // Called every minute to see if a scan is required
    this.check = function()
    {
	var id;
	var pages;
	var lastScan;
	var scanRate;
	var now;
	var doScan = false;

	pages = getRDFroot().getChildren();

	scan = new Scanner();
	now = new Date();

	while (pages.hasMoreElements()) {
	    id = pages.getNext().getValue();
	    scanRate = queryRDFitem(id, "scanratemins", "0");
	    if (scanRate) {
		lastScan = queryRDFitem(id, "lastscan", "");
		if (lastScan == "") {
		    lastScan = "5/11/1978";
		}
		lastScan = new Date(lastScan);
		if (now - lastScan > scanRate*1000*60) {
		    modifyRDFitem(id, "lastscan", now.toString());
		    saveRDF();
		    doScan = true;
		    scan.addURL(id, queryRDFitem(id, "title", "No Title"), 
				    queryRDFitem(id, "url", ""), 
				    queryRDFitem(id, "content", ""), 
				    queryRDFitem(id, "threshold", 100));
		}
	    }
	}

	if (doScan) {
	    numChanges = 0;
	    scan.start(auto.scanChanged, 
		       auto.scanFinished, 
		       auto.scanShowProgress);
	}
    }

    this.scanChanged = function(id, content, status)
    {
	if (status == STATUS_CHANGE) {
	    numChanges++;
	    modifyRDFitem(id, "changed", "1");
	    modifyRDFitem(id, "content", content);
	    modifyRDFitem(id, "error", "0");
	} else if (status == STATUS_NO_CHANGE) {
	    modifyRDFitem(id, "error", "0");
	} else if (status == STATUS_NEW) {
	    modifyRDFitem(id, "content", content);
	    modifyRDFitem(id, "error", "0");
	} else {
	    modifyRDFitem(id, "error", "1");
	}
	saveRDF();
    }

    this.scanFinished = function(errors)
    {
	callback(numChanges);
    }

    this.scanShowProgress = function(value, max)
    {
    }

}

