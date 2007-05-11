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
	var lastAutoScan;
	var scanRate;
	var now;
	var doScan = false;

	pages = getRDFroot().getChildren();

	scan = new Scanner();
	now = new Date();

	while (pages.hasMoreElements()) {
	    id = pages.getNext().getValue();
	    scanRate = queryRDFitem(id, "scanratemins", "0");
	    if (scanRate != "0") {
		lastAutoScan = queryRDFitem(id, "lastautoscan", "");
		if (lastAutoScan == "") {
		    lastAutoScan = "5/11/1978";
		}
		lastAutoScan = new Date(lastAutoScan);
		if (now - lastAutoScan > scanRate*1000*60) {
		    modifyRDFitem(id, "lastautoscan", now.toString());
		    saveRDF();
		    doScan = true;
		    filebase = id.substr(6);
		    scan.addURL(id, queryRDFitem(id, "title", "No Title"), 
				    queryRDFitem(id, "url", ""), 
				    readFile(filebase+".new"),
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

    this.scanChanged = function(id, new_content, status)
    {
	var now = new Date();
	filebase = id.substr(6);
	if (status == STATUS_CHANGE) {
	    numChanges++;
	    if (queryRDFitem(id, "changed") == "0") {
		// If this is a new change, save the previous state for diffing
		rmFile(filebase+".old");
		mvFile(filebase+".new", filebase+".old");
		old_lastscan = queryRDFitem(id, "lastscan", "");
		modifyRDFitem(id, "old_lastscan", old_lastscan);
	    }

	    writeFile(filebase+".new", new_content);
	    modifyRDFitem(id, "changed", "1");
	    modifyRDFitem(id, "lastscan", now.toString());
	    modifyRDFitem(id, "error", "0");
	} else if (status == STATUS_NO_CHANGE) {
	    modifyRDFitem(id, "error", "0");
	    modifyRDFitem(id, "lastscan", now.toString());
	} else if (status == STATUS_NEW) {
	    writeFile(filebase+".new", new_content);
	    writeFile(filebase+".old", new_content);
	    modifyRDFitem(id, "lastscan", now.toString());
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

