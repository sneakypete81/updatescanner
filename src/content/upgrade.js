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
    var items = new Array();
    var params;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");
    var str=document.getElementById("updatescanStrings");

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
    if (versionMajor < 2 || 
        versionMajor == 2 && versionMinor < 0 ||
        versionMajor == 2 && versionMinor == 0 && versionRevision < 14) {
        // 2.0.14+ expects diffs to be done during scan, not during display
        // Need to generate diffs now.
        nodes = getRDFroot().getChildren();
        while (nodes.hasMoreElements()) { // Get a list of filename bases
            node = nodes.getNext();
            id = node.getValue();
            items.push(escapeFilename(id.substr(6)));
        }        
        params = {label:str.getString("upgradeLabel"), callback:upgrade2_0_14, 
                  items:items, data:null, 
                  cancelPrompt:str.getString("upgradeCancel"), retVal:null};       
        window.openDialog('chrome://updatescan/content/progress.xul', 
                          'dlgProgress', 
                          'chrome,dialog,modal,centrescreen', params);
        if (params.retVal) {
            // Upgrade was successful
            prefs.setIntPref("versionMajor", VERSION_MAJOR);
            prefs.setIntPref("versionMinor", VERSION_MINOR);
            prefs.setIntPref("versionRevision", VERSION_REVISION);
        }
    }
}

function upgrade2_0_14(filebase, data)
{
    // Create a diff file for the specified filebase
    var oldContent = readFile(filebase+".old")
    var newContent = readFile(filebase+".new")
    var diffContent = createDiffs(oldContent, newContent)   
    writeFile(filebase+".dif", diffContent)
}

    