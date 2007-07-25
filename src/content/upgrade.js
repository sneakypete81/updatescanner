const VERSION_MAJOR = 2;
const VERSION_MINOR = 0;
const VERSION_REVISION = 14;

function upgradeCheck()
{
    var nodes;
    var node;
    var id;
    var filebase;
    var versionMajor;
    var versionMinor;
    var versionRevision;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

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
            writeFile(escapeFilename(filebase)+".new", "**NEW**");// Mark as new
        }
        saveRDF();
    }

    if (      versionMajor < 2 || 
              versionMajor == 2 && versionMinor < 0 ||
              versionMajor == 2 && versionMinor == 0 && versionRevision < 14) {       
        if (upgrade_2_0_14()) {
            prefs.setIntPref("versionMajor", VERSION_MAJOR);
            prefs.setIntPref("versionMinor", VERSION_MINOR);
            prefs.setIntPref("versionRevision", VERSION_REVISION);
        }
    }
}

function upgrade_2_0_14()
{
    var nodes;
    var node;
    var id;
    var ids = new Array();
    var file;
    var files = new Array();
    var ucaseFiles = new Array();
    var params;
    var label;
    var str=document.getElementById("updatescanStrings");

    // Previous versions had bug where multiple items used the same file.
    // First, check for duplications
    nodes = getRDFroot().getChildren();
    while (nodes.hasMoreElements()) { // Get a list of filename bases
        node = nodes.getNext();
        id = node.getValue();
        ids.push(id);
        file = escapeFilename(id.substr(6))
        files.push(file);
        ucaseFiles.push(file.toUpperCase());
    }      
    label = str.getString("upgradeLabel")+" (1/3)..."  
    params = {label:label, 
              callback:upgradeCheckDup, 
              items:files, 
              data:ucaseFiles, 
              cancelPrompt:str.getString("upgradeCancel"), 
              retVal:null, 
              retData:null};       
    window.openDialog('chrome://updatescan/content/progress.xul', 
                      'dlgProgress', 
                      'chrome,dialog,modal,centrescreen', params);
    if (!params.retVal) {
        return false; // Upgrade was cancelled
    }
    
    // Delete the cache files for duplicate entries (might be corrupt)
    for (i in params.retData) {
        alert(params.retData[i]);
        rmFile(params.retData[i]+".old");
        rmFile(params.retData[i]+".new");
        rmFile(params.retData[i]+".dif");
    }

    // Rename existing cache files to use URL filebase instead of id
    for (i in files) {
  ;//      mvFile(*****)
    }


    // 2.0.14+ expects diffs to be done during scan, not during display
    // Need to generate diffs now.
    label = str.getString("upgradeLabel")+" (3/3)..."  
    params = {label:label, 
              callback:upgradeDiff, 
              items:files, 
              data:null, 
              cancelPrompt:str.getString("upgradeCancel"), 
              retVal:null, 
              retData:null};       
    window.openDialog('chrome://updatescan/content/progress.xul', 
                      'dlgProgress', 
                      'chrome,dialog,modal,centrescreen', params);
    if (!params.retVal) {
        return false;// Upgrade was cancelled
    }
    return true;
}

function upgradeDiff(filebase, data)
{
    // Create a diff file for the specified filebase
    var oldContent = readFile(filebase+".old");
    var newContent = readFile(filebase+".new");
    var diffContent = createDiffs(oldContent, newContent);
    writeFile(filebase+".dif", diffContent);
    return null;
}

function upgradeCheckDup(item, data)
{
    // Check if the item appears twice in the data
    if (data.indexOf(item.toUpperCase()) != 
        data.lastIndexOf(item.toUpperCase())) {
        alert(item);
        return item;
    }
    return null;
}
    