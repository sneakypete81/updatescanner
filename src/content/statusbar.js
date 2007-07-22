window.addEventListener("load", loadStatusbar, false);

var refresh;
var autoscan;

function loadStatusbar()
{
    var rdffile;

    // Connect to the RDF file
    rdffile = getRDFuri();
    initRDF(rdffile);

    // Check for refresh requests
    refresh = new Refresher("refreshTreeRequest", refreshStatusbar);
    refresh.start();

    // Start autoscanner
    autoscan = new Autoscan();
    autoscan.start(autoscanFinished);

    // Update the status bar icon
    refreshStatusbar();
}

function autoscanFinished(numChanges)
{
//    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
//                        .getService(Components.interfaces.nsIAlertsService); 

    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");

    var alertOneChange = strings.GetStringFromName("alertOneChange");
    var alertManyChanges = strings.GetStringFromName("alertManyChanges");

    var message

    refresh.request();
    if (numChanges) {
        if (numChanges == 1) {
            message = alertOneChange;
        } else {
            message = numChanges + " " + alertManyChanges;
        }
        window.openDialog("chrome://updatescan/content/alert.xul",
                  "alert:alert",
                  "chrome,dialog=yes,titlebar=no,popup=yes",
                  message);
    
    /*    alertsService.showAlertNotification(
            "chrome://updatescan/skin/updatescan_big.png", 
            "Update Scanner", 
            message, 
            false, 
            "", 
            null);
    */    
    }
}

// Called when a refresh is requested by the autoscanner or the sidebar
function refreshStatusbar()
{
    var statusbar = document.getElementById("UpdateScanStatusbar");
    var pages;
    var page;
    var changed = false;

    pages = getRDFroot().getChildren();
    while (pages.hasMoreElements()) {
        page = pages.getNext().getValue();
        if (queryRDFitem(page, "changed", "0") == "1") {
            changed=true;
            break;
        }
    }

    if (changed) {
        statusbar.setAttribute("status", "1");
    } else {
       statusbar.setAttribute("status", "0");
    }
}

