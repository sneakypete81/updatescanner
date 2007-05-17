// Requires: rdf/rdfds.js
//           rdf/rdf.js
//           scan.js
//           fuzzy.js
//           refresh.js
//           opentopwin.js
//           updatescanoverlay.js
var numChanges;
var refresh;
var scan;

function loadUpdateScan()
{
    var rdffile;
    var nodes;
    var node;
    var id;

    // Connect to the RDF file
    rdffile = getRDFuri();
    initRDF(rdffile);

    // link to the listbox
    var tree=document.getElementById("UpdateTree");
    tree.datasources=rdffile;
    tree.onclick=treeClick;
    refreshTree();

    // Handle new installations/upgrades
    if (!updatescanDirExists()) {
	createUpdatescanDir();
	nodes = getRDFroot().getChildren();
	numItems = getRDFroot().getChildCount();
	myDump(numItems);
	while (nodes.hasMoreElements()) {
	    node = nodes.getNext()
	    myDump(node.getValue());
            id = node.getValue();
	    modifyRDFitem(id, "content", ""); // Not using this anymore
	    modifyRDFitem(id, "changed", "0");
	    modifyRDFitem(id, "error", "0");
	    modifyRDFitem(id, "lastautoscan", "5 November 1978");
	    filebase = id.substr(6);
	    myDump(filebase);
	    writeFile(escapeFilename(filebase)+".new", "**NEW**"); // Mark as new
	}
	saveRDF();
	refreshTree();
    }	    

    // Check for refresh requests
    refresh = new Refresher("refreshTreeRequest", refreshTree);
    refresh.start();
}

function unloadUpdateScan()
{
    refresh.stop();
}

function treeClick(event)
{
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

    id = tree.contentView.getItemAtIndex(obj_Row.value).id;

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
    var numitems;
    var treeEmptyAlert=document.getElementById("strings").getString(
	                                       "treeEmptyAlert");
    var statusScanning=document.getElementById("strings").getString(
                                               "statusScanning");
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

        setStatus(statusScanning);
	numChanges=0;
        scan.start(scanChangedCallback, scanFinishedCallback, showProgress);
    }
    else
    {
        scanFinishedCallback(treeEmptyAlert);
    }

}

function scanChangedCallback(id, new_content, status)
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

	writeFile(escapeFilename(filebase)+".new", new_content);
	modifyRDFitem(id, "changed", "1");
	modifyRDFitem(id, "lastscan", now.toString());
	modifyRDFitem(id, "error", "0");
    } else if (status == STATUS_NO_CHANGE) {
	modifyRDFitem(id, "error", "0");
	modifyRDFitem(id, "lastscan", now.toString());
    } else if (status == STATUS_NEW) {
	writeFile(escapeFilename(filebase)+".new", new_content);
	writeFile(escapeFilename(filebase)+".old", new_content);
	modifyRDFitem(id, "lastscan", now.toString());
	modifyRDFitem(id, "old_lastscan", now.toString());
	modifyRDFitem(id, "error", "0");
    } else {
	modifyRDFitem(id, "error", "1");
    }
    saveRDF();
    refreshTree();
    refresh.request();
}

function scanFinishedCallback(errors)
{
    var statusError=document.getElementById("strings").getString(
	                                    "statusError");
    var statusNoChanges=document.getElementById("strings").getString(
	                                        "statusNoChanges");
    var statusOneChange=document.getElementById("strings").getString(
	                                        "statusOneChange");
    var statusManyChanges=document.getElementById("strings").getString(
	                                          "statusManyChanges");

    if (errors != "") {
	setStatus(statusError);
        alert(errors);
    } else if (numChanges == 0) {
	setStatus(statusNoChanges);
    } else {
	if (numChanges == 1) {
	    setStatus(statusOneChange);
	    message = "A webpage has been updated";
	} else {
	    setStatus(numChanges+" "+statusManyChanges);
	    message = numChanges+" webpages have been updated";
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
    var statusCancel=document.getElementById("strings").getString(
	                                     "statusCancel");
    if (scan != null) {
	scan.cancel();
    }
    showScanButton();
    setStatus(statusCancel);
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
    var titleEditItem=document.getElementById("strings").getString(
	                                     "titleEditItem");
    var result = new Array(8);
    var id;
    var oldurl;
    
    id=getSelectedItemID(); 
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
    
    old_lastScan = new Date(queryRDFitem(id, "old_lastscan", "5/11/1978"));
    oldDate = dateDiffString(old_lastScan, now);
    lastScan = new Date(queryRDFitem(id, "lastscan", "5/11/1978"));
    newDate = dateDiffString(lastScan, now);

    filebase = id.substr(6);
    return displayDiffs(queryRDFitem(id, "title", "No Title"), 
			queryRDFitem(id, "url", ""), 
			readFile(escapeFilename(filebase)+".old"),
			readFile(escapeFilename(filebase)+".new"),
			oldDate, 
			newDate);
}

function diffSelectedItemThisWindow()
{
    diffItemThisWindow(getSelectedItemID());
}

function diffItemThisWindow(id)
{
    diffURL = diffItem(id)
    openTopWin(diffURL);
    focusTree();
}

function diffSelectedItemNewTab()
{
    diffItemNewTab(getSelectedItemID());    
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

    diffURL = diffItem(id);
    mainWindow.getBrowser().addTab(diffURL);
}

function dateDiffString(oldDate, newDate)
{
    diff = newDate.getTime() - oldDate.getTime();
    diff = diff / 1000; // convert to seconds
    diff = diff / 60;   // minutes
    diff = diff / 60;   // hours
    if (diff < 24) {
	if (oldDate.getDate() != newDate.getDate())
	    ret = " yesterday at ";
	else
	    ret = " today at ";
	ret += oldDate.getHours()+":";
	mins = oldDate.getMinutes().toString();
	if (mins.length == 1)
	    mins = "0" + mins;
	ret += mins;
	return ret;
    }
    diff = diff / 24;
    if (diff < 7) {
	diff = Math.floor(diff);
	if (diff == 1)
	    return diff+" day ago";
	else
	    return diff+" days ago";
    }
    diff = diff / 7;
    if (diff < 52) {
	diff = Math.floor(diff);
	if (diff == 1)
	    return diff+" week ago";
	else
	    return diff+" weeks ago";
    }
    diff = diff / 52;
    diff = Math.floor(diff);
    if (diff == 1)
	return diff+" year ago";
    else
	return diff+" years ago";
}

function markAllAsVisited()
{
    var tree = document.getElementById("UpdateTree");

    numitems = getNumItems();
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
            id = tree.contentView.getItemAtIndex(i).id;

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

    numitems = getNumItems();
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
            id = tree.contentView.getItemAtIndex(i).id;
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
    var tree = document.getElementById("UpdateTree");

    numitems = getNumItems();

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
    for (i = 0; i<count; i++) {
	lastTitle = "";
	lastIndex = 0;
	for (j in items) {
	    title = queryRDFitem(items[j], "title");
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
    id=getSelectedItemID(); 
    var title = queryRDFitem(id, "title", "untitled");

    if (confirm("Are you sure you want to delete "+title+"?")) {
	deleteRDFitem(id);
	saveRDF();
	refreshTree();
	refresh.request();
    }
}

function getSelectedItemID()
{
    var tree = document.getElementById("UpdateTree");
    return tree.contentView.getItemAtIndex(tree.currentIndex).id;
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
    var tree=document.getElementById("UpdateTree");
    savedRow = tree.currentIndex;
    tree.builder.rebuild();    
    tree.view.selection.select(savedRow);
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