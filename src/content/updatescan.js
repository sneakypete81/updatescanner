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
    var tree;
    var rdffile;

    // Connect to the RDF file
    rdffile = getRDFuri();
    initRDF(rdffile);

    // link to the listbox
    tree = document.getElementById("UpdateTree");
    tree.datasources=rdffile;
    tree.onclick=treeClick;

    upgradeCheck(); // See if we need to upgrade something

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
    if (getNumItems() == 0) return;

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
            diffItemThisWindow(id, 1);
            break;
        case 1:
            diffItemNewTab(id, 1);
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
    if (numitems > 0) {
        scan = new Scanner()
        
        for (var i=0; i<numitems; i++) {
            id = tree.contentView.getItemAtIndex(i).id;
            filebase=urlToFilename(queryRDFitem(id, "url", ""))
            scan.addURL(id, queryRDFitem(id, "title", "No Title"), 
                        queryRDFitem(id, "url", ""), 
                        readFile(filebase+".new"),
                        queryRDFitem(id, "threshold", 100));
        }

        setStatus(str.getString("statusScanning"));
        numChanges=0;
        scan.start(scanChangedCallback, scanFinishedCallback, showProgress);
    } else {
        scanFinishedCallback(str.getString("treeEmptyAlert"));
    }
}

function scanChangedCallback(id, new_content, status, statusText, headerText)
{
    if (processScanChange(id, new_content, status, statusText, headerText)) {
        numChanges++;
    }
    refreshTree();
    refresh.request();
}

function scanFinishedCallback()
{
    var str=document.getElementById("updatescanStrings");

    if (numChanges == 0) {
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
    var args = {
        winTitle:"", 
        title:          title, 
        url:            url, 
        threshold:      "100",      // threshold = 100 by default
        scanRateMins:   "60",       // scan once an hour by default
        encodingDetect: "Auto",     // Auto-detect encoding by default 
        encoding:       "UTF-8",    // UTF-8 encoding by default
        advanced:       false
    };

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgNew', 
                      'chrome,dialog,modal,centrescreen', args);
    if (args.ok) {
        id = addRDFitem();
        modifyRDFitem(id, "title", args.title);
        modifyRDFitem(id, "url", args.url);
        modifyRDFitem(id, "threshold", args.threshold);
        modifyRDFitem(id, "scanratemins", args.scanRateMins);
        modifyRDFitem(id, "encodingDetect", args.encodingDetect);
        modifyRDFitem(id, "encoding", args.encoding);

        filebase = urlToFilename(args.url);
        writeFile(filebase+".new", "**NEW**");

        modifyRDFitem(id, "lastscan", "");  // lastscan not defined
        modifyRDFitem(id, "changed", "0");  // not changed 
        modifyRDFitem(id, "error", "0");    // no error
        saveRDF();

    }
}

function openEditDialog()
{
    var titleEditItem=document.getElementById("updatescanStrings")
                          .getString("titleEditItem");
    
    var id=getSelectedItemID();
    if (id == "") return;

    var args = {
        winTitle:   document.getElementById("updatescanStrings")
                            .getString("titleEditItem"),
        title:          queryRDFitem(id, "title", "No Title"),
        url:            queryRDFitem(id, "url", ""),
        threshold:      queryRDFitem(id, "threshold", "100"),
        scanRateMins:   queryRDFitem(id, "scanratemins", "0"),
        encodingDetect: queryRDFitem(id, "encodingDetect", "Auto"),
        encoding:       queryRDFitem(id, "encoding", "UTF-8"),
        advanced:       false
    }

    var oldurl = args.url;

    window.openDialog('chrome://updatescan/content/dlgnewedit.xul', 'dlgEdit', 
                      'chrome,dialog,modal,centrescreen', args);
                      
    if (args.ok) {
        modifyRDFitem(id, "title", args.title);
        modifyRDFitem(id, "url", args.url);
        modifyRDFitem(id, "threshold", args.threshold);
        modifyRDFitem(id, "scanratemins", args.scanRateMins);
        modifyRDFitem(id, "encodingDetect", args.encodingDetect);
        modifyRDFitem(id, "encoding", args.encoding);

        if (oldurl != args.url) {   // URL changed - reset all values
            filebase = urlToFilename(args.url);
            writeFile(filebase+".new", "**NEW**");

            modifyRDFitem(id, "lastscan", "");  // lastscan not defined
            modifyRDFitem(id, "changed", "0");  // not changed
            modifyRDFitem(id, "error", "0");    // no error
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

function diffItem(id, numItems)
{
    var now = new Date();
    modifyRDFitem(id, "changed", "0");
    saveRDF();

    refreshTree();
    refresh.request();
    
    var old_lastScan = queryRDFitem(id, "old_lastscan", "")
    if (old_lastScan == "") old_lastScan = "5 November 1978";
    old_lastScan = new Date(old_lastScan);
    var oldDate = dateDiffString(old_lastScan, now);

    var lastScan =queryRDFitem(id, "lastscan", "");
    if (lastScan == "") lastScan = "5 November 1978";
    lastScan = new Date(lastScan);
    var newDate = dateDiffString(lastScan, now);

    var filebase = urlToFilename(queryRDFitem(id, "url", ""));
    return displayDiffs(queryRDFitem(id, "title", "No Title"), 
            queryRDFitem(id, "url", ""), 
            readFile(filebase+".old"),
            readFile(filebase+".new"),
            readFile(filebase+".dif"),
            oldDate, newDate, numItems);
}

function diffSelectedItemThisWindow()
{
    var item = getSelectedItemID();
    if (item == "") return;
    diffItemThisWindow(item, 1);
}

function diffItemThisWindow(id, numItems)
{
    var diffURL = diffItem(id, numItems)
    openTopWin(diffURL);
    focusTree();
}

function diffSelectedItemNewTab()
{
    var item = getSelectedItemID();
    if (item == "") return;
    diffItemNewTab(item, 1);    
}

function diffItemNewTab(id, maxItems)
{
    var mainWindow = window.QueryInterface(
    Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow);

    var diffURL = diffItem(id, maxItems);
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
        if (oldDate.getDate() != newDate.getDate()) {
            ret = " "+str.getString("yesterdayAt")+" ";
        } else {
            ret = " "+str.getString("todayAt")+" ";
        }
        ret += oldDate.getHours()+":";
        var mins = oldDate.getMinutes().toString();
        if (mins.length == 1) {
            mins = "0" + mins;
        }
        ret += mins;
        return ret;
    }
    diff = diff / 24;
    if (diff < 7) {
        diff = Math.floor(diff);
        if (diff == 1) {
            return diff+" "+str.getString("dayAgo");
        } else {
            return diff+" "+str.getString("daysAgo");
        }
    }
    diff = diff / 7;
    if (diff < 52) {
        diff = Math.floor(diff);
        if (diff == 1) {
            return diff+" "+str.getString("weekAgo");
        } else {
            return diff+" "+str.getString("weeksAgo");
        }
    }
    diff = diff / 52;
    diff = Math.floor(diff);
    if (diff == 1) {
        return diff+" "+str.getString("yearAgo");
    } else {
        return diff+" "+str.getString("yearsAgo");
    }
}

function markAllAsVisited()
{
    var tree = document.getElementById("UpdateTree");

    var numitems = getNumItems();
    if (numitems > 0) {
        for (var i=0; i<numitems; i++) {
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

    var numItems = getNumItems();
    if (numItems > 0) {
        for (var i=0; i<numItems; i++) {
            var id = tree.contentView.getItemAtIndex(i).id;
            if (queryRDFitem(id, "changed") != "0") {
                diffItemNewTab(id, numItems);
            }
        }
    }
}

function sortByName()
{
    var i;
    var id;
    var item;
    var tree = document.getElementById("UpdateTree");
    var numitems = getNumItems();
    var data = new Array();
    var indexes = new Array();
    var params;
    var str=document.getElementById("updatescanStrings");

    // Get a list of ids & titles
    if (numitems > 0)
    {
        for (var i=0; i<numitems; i++)
        {
            id = tree.contentView.getItemAtIndex(i).id;
            item = {id:id, title:queryRDFitem(id, "title").toLowerCase()}
            data.push(item);
            indexes.push(i);
        }
        // Open the progress dialog and perform the sort
        params = {label:str.getString("sortLabel"), callback:sortItem, 
                  items:indexes, data:data, 
                  cancelPrompt:str.getString("sortCancel"), 
                  retVal:null, retData:null};       
        window.openDialog('chrome://updatescan/content/progress.xul', 
                          'dlgProgress', 
                          'chrome,dialog,modal,centrescreen', params);

        saveRDF();
        refreshTree();
        refresh.request();
    }
    
}

function sortItem(index, data)
// Passed the current index and the remaining items to sort.
// Finds the smallest item, moves it into position, removes it from the 
// data array.
{
    var i;
    var smallestIndex = 0;
    var smallestTitle = data[0].title;
    var count = data.length;
    for (i=1; i<count; i++) {
        if (data[i].title < smallestTitle) {
            smallestIndex = i;
            smallestTitle = data[i].title;
        }
    }
    if (smallestIndex != 0) {
        moveRDFitem(data[smallestIndex].id, index); // Move into position
    }
    data.splice(smallestIndex, 1);              // Remove from data array
    return null;    
}

function deleteSelectedItem()
{
    var str=document.getElementById("updatescanStrings")
    var id=getSelectedItemID();
    var fileBase=urlToFilename(queryRDFitem(id, "url", ""))

    if (id == "") return;
    var title = queryRDFitem(id, "title", "untitled");

    if (confirm(str.getString("confirmDelete") + " " + title + "?")) {
        rmFile(fileBase+".old");
        rmFile(fileBase+".new");
        rmFile(fileBase+".dif");
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
