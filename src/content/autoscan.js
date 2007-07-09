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

	//Don't check straight away - wait for 1 minute.
	//auto.check();
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
	var filebase;

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
  				    readFile(escapeFilename(filebase)+".new"),
				    queryRDFitem(id, "threshold", 100));
		}
	    }
	}

	if (doScan) {
	    numChanges = 0;
	    scan.start(auto.scanChanged, 
		       auto.scanFinished, 
		       auto.scanShowProgress);
	} else {
	    callback(0); // No changes
	}
    }

    this.scanChanged = function(id, new_content, status)
    {
        processScanChange(id, new_content, status)
    }

    this.scanFinished = function(errors)
    {
	callback(numChanges);
    }

    this.scanShowProgress = function(value, max)
    {
    }

}

