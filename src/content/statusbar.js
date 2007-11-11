/* ***** BEGIN LICENSE BLOCK *****
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is Update Scanner.
 * 
 * The Initial Developer of the Original Code is Pete Burgers.
 * Portions created by Pete Burgers are Copyright (C) 2006-2007
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.  
 * ***** END LICENSE BLOCK ***** */

window.addEventListener("load", loadStatusbar, false);
window.addEventListener("unload", unloadStatusbar, false);

var refresh;

function loadStatusbar()
{
    var rdffile;
    var backupfile;
    var corruptfile;

    rdffile = getRDFpath();

    backupfile = rdffile.parent;
    backupfile.append("updatescan_backup.rdf");
    corruptfile = rdffile.parent;
    corruptfile.append("updatescan_corrupt.rdf");
  
    if (!checkRDF(rdffile.path)) {
        // RDF is corrupt - restore from last backup
        USc_file.rmFile(corruptfile.path);
        USc_file.cpFile(rdffile.path, corruptfile.path);
        USc_file.rmFile(rdffile.path);
        USc_file.cpFile(backupfile.path, rdffile.path);
    }

    initRDF(getURI(rdffile));

    // Backup the rdf file in case of corruption
    USc_file.rmFile(backupfile.path);
    USc_file.cpFile(rdffile.path, backupfile.path);

    // Check for refresh requests
    refresh = new USc_refresher();
    refresh.register("refreshTreeRequest", refreshStatusbar);

    // Start autoscanner
    USc_autoscan.start(autoscanFinished);

    // Update the status bar icon
    refreshStatusbar();
}

function unloadStatusbar()
{
    try { 
        refresh.unregister(); 
    } catch(e) {}
}

function autoscanFinished(numChanges)
{
//    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
//                        .getService(Components.interfaces.nsIAlertsService); 

    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");

    var alertOneChange = strings.GetStringFromName("alertOneChange");
    var param;
    var alertManyChanges = strings.GetStringFromName("alertManyChanges");

    var message;

    refresh.request();
    if (numChanges) {
        if (numChanges == 1) {
            message = alertOneChange;
        } else {
            param = {numChanges:numChanges};
            message = alertManyChanges.supplant(param);
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

