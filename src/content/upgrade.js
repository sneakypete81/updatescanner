const VERSION_MAJOR = 2;
const VERSION_MINOR = 0;
const VERSION_REVISION = 14;

function upgradeCheck()
{
   
    var nodes;
    var node;
    var id;
    var ids = new Array();
    var filebase;
    var versionMajor;
    var versionMinor;
    var versionRevision;
    var file;
    var files = new Array();
    var ucaseFiles = new Array();
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
        params = {label:str.getString("duplicateLabel"), 
                  callback:upgradeCheckDup, items:files, data:ucaseFiles,
                  cancelPrompt:str.getString("upgradeCancel"), retVal:null};       
        window.openDialog('chrome://updatescan/content/progress.xul', 
                          'dlgProgress', 
                          'chrome,dialog,modal,centrescreen', params);
        if (!params.retVal) {
            return; // Upgrade was cancelled
        }                  

        // 2.0.14+ expects diffs to be done during scan, not during display
        // Need to generate diffs now.
        params = {label:str.getString("upgradeLabel"), callback:upgrade2_0_14, 
                  items:files, data:null, 
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
    var oldContent = readFile(filebase+".old");
    var newContent = readFile(filebase+".new");
    var diffContent = createDiffs(oldContent, newContent);   
    writeFile(filebase+".dif", diffContent);
}

function upgradeCheckDup(item, data)
{
    // Check if the item appears twice in the data
    if (data.indexOf(item.toUpperCase()) != 
        data.lastIndexOf(item.toUpperCase())) {
        alert(item);
    }
}
    