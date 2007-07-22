// This code is copied from the "AddToBookmarks" context menu item.
// Requires: rdf/rdfds.js
//           rdf/rdf.js
//           updatescan.js

var initRDFdone = false;

window.addEventListener("load", updatescan_overlay_init, false);

function updatescan_overlay_init() 
{
    // Eventlistener for the contextmenu
    try {
        var menu = document.getElementById("contentAreaContextMenu");
        menu.addEventListener("popupshowing", updatescan_showMenu, false);
    } catch (e) {
        ;
    }
}

// Don't show context menu item when text is selected.
function updatescan_showMenu() 
{
    if(gContextMenu.isTextSelected) {
        // selected text = don't show menu item
        document.getElementById("AddToUpdateScan").hidden = true;
    } else {
        document.getElementById("AddToUpdateScan").hidden = false;
    }
}

function addToUpdateScan(aBrowser)
{
    var rdffile;

    if (!initRDFdone) {
        rdffile = getRDFuri();
        initRDF(rdffile);
        initRDFdone = true;
    }

    const browsers = aBrowser.browsers;
    if (browsers && browsers.length > 1) {
        addToUpdateScanForTabBrowser(aBrowser);
    } else {
        addToUpdateScanForBrowser(aBrowser.webNavigation);
    }
}

function addToUpdateScanForTabBrowser(aTabBrowser)
{
    var tabsInfo = [];
    var currentTabInfo = { name: "", url: "", charset: null };

    const activeBrowser = aTabBrowser.selectedBrowser;
    const browsers = aTabBrowser.browsers;
    for (var i = 0; i < browsers.length; ++i) {
        var webNav = browsers[i].webNavigation;
        var url = webNav.currentURI.spec;
        var name = "";
        var charSet;
        try {
            var doc = webNav.document;
            name = doc.title || url;
            charSet = doc.characterSet;
        } catch (e) {
            name = url;
        }
        tabsInfo[i] = { name: name, url: url, charset: charSet };
        if (browsers[i] == activeBrowser) {
            currentTabInfo = tabsInfo[i];
        }
    }
    openNewDialogNoRefresh(currentTabInfo.name, currentTabInfo.url)
}

function addToUpdateScanForBrowser(aDocShell)
{
    // Bug 52536: We obtain the URL and title from the nsIWebNavigation
    // associated with a <browser/> rather than from a DOMWindow.
    // This is because when a full page plugin is loaded, there is
    // no DOMWindow (?) but information about the loaded document
    // may still be obtained from the webNavigation. 
    var url = aDocShell.currentURI.spec;
    var title, charSet = null;
    try {
        title = aDocShell.document.title || url;
        charSet = aDocShell.document.characterSet;
    } catch (e) {
        title = url;
    }
    openNewDialogNoRefresh(title, url);
}
