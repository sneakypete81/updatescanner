// Requires: rdf/rdfds.js
//           rdf/rdf.js
//           scan.js
//           fuzzy.js
//           refresh.js
//           opentopwin.js
//           updatescanoverlay.js
const VERSION_MAJOR = 2;
const VERSION_MINOR = 0;
const VERSION_REVISION = 12;

var numChanges;
var refresh;
var scan;

function loadUpdateScan()
{
    var tree;
    var rdffile;
    var nodes;
    var node;
    var id;
    var filebase;
    var version;
    var filebase;
    var oldContent;
    var newContent;
    var diffContent;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    // Connect to the RDF file
    rdffile = getRDFuri();
    initRDF(rdffile);

    // link to the listbox
    tree = document.getElementById("UpdateTree");
    tree.datasources=rdffile;
    tree.onclick=treeClick;

    // Handle new installations/upgrades
    try {
        versionMajor = prefs.getIntPref("versionMajor");
        versionMinor = prefs.getIntPref("versionMinor");
        versionRevision = prefs.getIntPref("versionRevision");
    } catch (e) {
        versionMajor = 0;
        versionMinor = 0;
        versionRevision = 0;
    }
    if (!updatescanDirExists()) {
        // Version 2.0.0+ expects webpage data to be in files, 
        // not embedded in RDF
        createUpdatescanDir();
        nodes = getRDFroot().getChildren();
        while (nodes.hasMoreElements()) {
            node = nodes.getNext();
            id = node.getValue();
            modifyRDFitem(id, "content", ""); // Not using this anymore
            modifyRDFitem(id, "changed", "0");
            modifyRDFitem(id, "error", "0");
            modifyRDFitem(id, "lastautoscan", "5 November 1978");
            filebase = id.substr(6);
            writeFile(escapeFilename(filebase)+".new", "**NEW**"); // Mark as new
        }
        saveRDF();
    }
    if (versionMajor <= 2 && versionMinor <= 0 && versionRevision <= 11) {
        // 2.0.12+ expects diffs to be done during scan, not during display
        // Need to generate diffs now.
        nodes = getRDFroot().getChildren();
        while (nodes.hasMoreElements()) {
            node = nodes.getNext();
            id = node.getValue();
            filebase = escapeFilename(id.substr(6));
            oldContent = readFile(filebase+".old")
            newContent = readFile(filebase+".new")
            diffContent = createDiffs(oldContent, newContent)   
            writeFile(filebase+".dif", diffContent)
        }
        prefs.setIntPref("versionMajor", VERSION_MAJOR);
        prefs.setIntPref("versionMinor", VERSION_MINOR);
        prefs.setIntPref("versionRevision", VERSION_REVISION);
    }
    
    // Check for refresh requests
    refresh = new Refresher("refreshTreeRequest", refreshTree);
    refresh.start();
    refresh.request();
}

function unloadUpdateScan()
{
    refresh.stop();
}

function treeClick(event)
{
    if (getNumItems() == 0)
	return;

    // Code from http://xul.andreashalter.ch/
    //get original target (element user clicked on) 
    var str_OrigTarget = event.originalTarget; 
    //if target is a treechildren, we're right 
    if (str_OrigTarget.localName == "treechildren") { 
	//create storage containers for results values 
	var obj_Row = new Object; 
	var obj_Col = new Object; 
	var obj_Child = new Object; 
	//find tree holder 
	var tree = document.getElementById('UpdateTree'); 
	//get cell at x/y coords from tree 
	tree.treeBoxObject.getCellAt(event.clientX, event.clientY, obj_Row, obj_Col, obj_Child); 
	//if row < 0, we didn't find the row selected in this tree 
	if (obj_Row.value == -1) 
	{
	    return; 
	}
    } 

    var id = tree.contentView.getItemAtIndex(obj_Row.value).id;

    switch (event.button) {
    case 0:
	diffItemThisWindow(id);
	break;
    case 1:
	diffItemNewTab(id);
	break;
    }
}

function scanButtonClick()
{
    var id;
    var filebase;
    var numitems;
    var str=document.getElementById("updatescanStrings")

    showStopButton();
    
    var tree = document.getElementById("UpdateTree");

    numitems = getNumItems();
    if (numitems > 0)
    {
	scan = new Scanner()
        
        for (var i=0; i<numitems; i++)
        {
            id = tree.contentView.getItemAtIndex(i).id;
	    filebase = id.substr(6);
            scan.addURL(id, queryRDFitem(id, "title", "No Title"), 
			queryRDFitem(id, "url", ""), 
			readFile(escapeFilename(filebase)+".new"),
			queryRDFitem(id, "threshold", 100));
        }

        setStatus(str.getString("statusScanning"));
	numChanges=0;
        scan.start(scanChangedCallback, scanFinishedCallback, showProgress,
		   true); // doTimeout=true, for a 10-second timeout for each webpage
    }
    else
    {
        scanFinishedCallback(str.getString("treeEmptyAlert"));
    }

}

function scanChangedCallback(id, new_content, status)
{
    if (processScanChange(id, new_content, status)) {
	numChanges++;
    }
    refreshTree();
    refresh.request();
}

function scanFinishedCallback(errors)
{
    var str=document.getElementById("updatescanStrings");

    if (errors != "") {
	setStatus(str.getString("statusError"));
        alert(errors);
    } else if (numChanges == 0) {
	setStatus(str.getString("statusNoChanges"));
    } else {
	if (numChanges == 1) {
	    setStatus(str.getString("statusOneChange"));
	    message = str.getString("alertOneChange");
	} else {
	    setStatus(numChanges+" "+str.getString("statusManyChanges"));
	    message = numChanges+" "+str.getString("alertManyChanges");
	}
	window.openDialog("chrome://updatescan/content/alert.xul",
			  "alert:alert",
			  "chrome,dialog=yes,titlebar=no,popup=yes",
			  message);
    }
    hideProgress();
    showScanButton();
}

function stopButtonClick()
{
    var str=document.getElementById("updatescanStrings");

    if (scan != null) {
	scan.cancel();
    }
    showScanButton();
    setStatus(str.getString("statusCancel"));
}

function openNewDialog()
{
    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow) 

    addToUpdateScan(mainWindow.document.getElementById('content'))
    refreshTree();
    refresh.request();
}

function openNewDialogNoRefresh(title, url)
{
    var id;
    var filebase;
    var result = new Array(8);
    result[0] = url;
    result[1] = title;
    result[2] = "100";     // threshold = 100 by default
    result[3] = "";        // lastscan not defined by default
    result[4] = "0";       // changed = 0 by default
    result[5] = "**NEW**"; // content flagged as new
    result[6] = "0";       // error = 0 by default
    result[7] = "60";      // scan once an hour by default

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgNew', 
                      'chrome,dialog,modal,centrescreen', '', 
		      result);
    if (result[0] != null) {
	id = addRDFitem();
	filebase = id.substr(6);
	writeFile(escapeFilename(filebase)+".new", result[5]);	
        modifyRDFitem(id, "url", result[0]);
        modifyRDFitem(id, "title", result[1]);
        modifyRDFitem(id, "threshold", result[2]);
        modifyRDFitem(id, "lastscan", result[3]);
        modifyRDFitem(id, "changed", result[4]);
	modifyRDFitem(id, "error", result[6]);
	modifyRDFitem(id, "scanratemins", result[7]);
	saveRDF();
    }
}

function openEditDialog()
{
    var titleEditItem=document.getElementById("updatescanStrings")
	                      .getString("titleEditItem");
    var result = new Array(8);
    var id;
    var oldurl;
    
    id=getSelectedItemID();
    if (id == "")
	return;

    result[0] = queryRDFitem(id, "url", "");
    result[1] = queryRDFitem(id, "title", "No Title");
    result[2] = queryRDFitem(id, "threshold", "100");
    result[3] = "";        // lastscan not defined by default
    result[4] = "0";       // changed = 0 by default
    result[5] = "**NEW**"; // content flagged as new
    result[6] = "0";       // error = 0 by default
    result[7] = queryRDFitem(id, "scanratemins", "0"); 

    oldurl = result[0];

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 
		      'dlgEdit', 
                      'chrome,dialog,modal,centrescreen', 
		      titleEditItem, 
		      result);
    if (result[0] != null) {
        if (oldurl == result[0]) { // URL not changed - don't reset changes
            modifyRDFitem(id, "title", result[1]);
	    modifyRDFitem(id, "threshold", result[2]);
	    modifyRDFitem(id, "scanratemins", result[7]);
        } else {
	    filebase = id.substr(6);
	    writeFile(escapeFilename(filebase)+".new", result[5]);	
            modifyRDFitem(id, "url", result[0]);
            modifyRDFitem(id, "title", result[1]);
            modifyRDFitem(id, "threshold", result[2]);
            modifyRDFitem(id, "lastscan", result[3]);
            modifyRDFitem(id, "changed", result[4]);
	    modifyRDFitem(id, "error", result[6]);
	    modifyRDFitem(id, "scanratemins", result[7]);
        }
	saveRDF();
    }
    refreshTree();
    refresh.request();
}

function openSelectedItem()
{
    modifyRDFitem(id, "changed", "0");
    saveRDF();
    openTopWin(queryRDFitem(id, "url"));
    refreshTree();
    refresh.request();
}

function diffItem(id)
{
    var now = new Date();
    modifyRDFitem(id, "changed", "0");
    saveRDF();

    refreshTree();
    refresh.request();
    
    var old_lastScan = new Date(queryRDFitem(id, "old_lastscan", "5/11/1978"));
    var oldDate = dateDiffString(old_lastScan, now);
    var lastScan = new Date(queryRDFitem(id, "lastscan", "5/11/1978"));
    var newDate = dateDiffString(lastScan, now);

    var filebase = escapeFilename(id.substr(6));
    return displayDiffs(queryRDFitem(id, "title", "No Title"), 
			queryRDFitem(id, "url", ""), 
			readFile(filebase+".old"),
			readFile(filebase+".new"),
			readFile(filebase+".dif"),
			oldDate, 
			newDate);
}

function diffSelectedItemThisWindow()
{
    var item = getSelectedItemID();
    if (item == "")
	return;
    diffItemThisWindow(item);
}

function diffItemThisWindow(id)
{
    var diffURL = diffItem(id)
    openTopWin(diffURL);
    focusTree();
}

function diffSelectedItemNewTab()
{
    var item = getSelectedItemID();
    if (item == "")
	return;
    diffItemNewTab(item);    
}

function diffItemNewTab(id)
{
    var mainWindow = window.QueryInterface(
	Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIWebNavigation)
	.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	.rootTreeItem
	.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = diffItem(id);
    mainWindow.getBrowser().addTab(diffURL);
}

function dateDiffString(oldDate, newDate)
{
    var ret; 
    var str=document.getElementById("updatescanStrings")

    var diff = newDate.getTime() - oldDate.getTime();
    diff = diff / 1000; // convert to seconds
    diff = diff / 60;   // minutes
    diff = diff / 60;   // hours
    if (diff < 24) {
	if (oldDate.getDate() != newDate.getDate())
	    ret = " "+str.getString("yesterdayAt")+" ";
	else
	    ret = " "+str.getString("todayAt")+" ";
	ret += oldDate.getHours()+":";
	var mins = oldDate.getMinutes().toString();
	if (mins.length == 1)
	    mins = "0" + mins;
	ret += mins;
	return ret;
    }
    diff = diff / 24;
    if (diff < 7) {
	diff = Math.floor(diff);
	if (diff == 1)
	    return diff+" "+str.getString("dayAgo");
	else
	    return diff+" "+str.getString("daysAgo");
    }
    diff = diff / 7;
    if (diff < 52) {
	diff = Math.floor(diff);
	if (diff == 1)
	    return diff+" "+str.getString("weekAgo");
	else
	    return diff+" "+str.getString("weeksAgo");
    }
    diff = diff / 52;
    diff = Math.floor(diff);
    if (diff == 1)
	    return diff+" "+str.getString("yearAgo");
    else
	    return diff+" "+str.getString("yearsAgo");
}

function markAllAsVisited()
{
    var tree = document.getElementById("UpdateTree");

    var numitems = getNumItems();
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
            var id = tree.contentView.getItemAtIndex(i).id;

	    if (queryRDFitem(id, "changed") != "0") {
		modifyRDFitem(id, "changed", "0");
		refreshTree();
	    }
        }
	saveRDF();
	refreshTree();
	refresh.request();
    }
}

function showAllChangesInNewTabs()
{
    var tree = document.getElementById("UpdateTree");

    var numitems = getNumItems();
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
            var id = tree.contentView.getItemAtIndex(i).id;
	    if (queryRDFitem(id, "changed") != "0") {
		diffItemNewTab(id);
	    }
        }
    }
}

function sortByName()
{
    var items = new Array();
    var title;
    var lastTitle;
    var lastIndex;
    var tree = document.getElementById("UpdateTree");
    var numitems = getNumItems();

    // Get a list of ids
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
	    items.push(tree.contentView.getItemAtIndex(i).id);
        }
    }

    // Move each item to the top of the list, starting with the last name
    var count = items.length
    for (var i = 0; i<count; i++) {
	lastTitle = "";
	lastIndex = 0;
	for (var j in items) {
	    title = queryRDFitem(items[j], "title").toLowerCase();
	    if (title > lastTitle) {
		lastTitle = title;
		lastIndex = j;
	    }
	}
	moveRDFitem(items[lastIndex], 0); // Move to the top
	items.splice(lastIndex, 1);       // Remove from the list
    }
    saveRDF();
    refreshTree();
    refresh.request();
}

function deleteSelectedItem()
{
    var str=document.getElementById("updatescanStrings")
    var id=getSelectedItemID();
    if (id == "")
	return;
    var title = queryRDFitem(id, "title", "untitled");

    if (confirm(str.getString("confirmDelete") + " " + title + "?")) {
	deleteRDFitem(id);
	saveRDF();
	refreshTree();
	refresh.request();
    }
}

function getSelectedItemID()
{
    var tree = document.getElementById("UpdateTree");
    var id;
    try {
	id = tree.contentView.getItemAtIndex(tree.currentIndex).id;
    } catch (e) {
	id = "";
    }

    return id;
}

function showStopButton()
{
    var scanbutton = document.getElementById("scanbutton");
    scanbutton.setAttribute("label", scanbutton.getAttribute("stopbuttonlabel"));
    scanbutton.setAttribute("oncommand", scanbutton.getAttribute("stopbuttoncommand"));
}

function showScanButton()
{
    var scanbutton = document.getElementById("scanbutton");
    scanbutton.setAttribute("label", scanbutton.getAttribute("scanbuttonlabel"));
    scanbutton.setAttribute("oncommand", scanbutton.getAttribute("scanbuttoncommand"));
}

function refreshTree()
{
    try {
	var tree=document.getElementById("UpdateTree");
	var savedRow = tree.currentIndex;
	tree.builder.rebuild();    
	tree.view.selection.select(savedRow);
    } catch (e) {
	;
    }
}

function focusTree()
{
    var tree=document.getElementById("UpdateTree");
    tree.focus();
}

function setStatus(status)
{
    document.getElementById("StatusText").value = status;
}

function showProgress(value, max)
{
    var progress = document.getElementById("Progress");
    progress.collapsed = false;
    progress.value = 100*value/max;
}

function hideProgress()
{   
    document.getElementById("Progress").collapsed=true;
}

function getNumItems()
{
    var tree = document.getElementById("UpdateTree");
    try {
        return tree.contentView.rowCount;
    } catch(e) {
        return 0;
    }
}
