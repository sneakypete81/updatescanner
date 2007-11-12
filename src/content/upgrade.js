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

if (typeof(USc_upgrade_exists) != 'boolean') {
var USc_upgrade_exists = true;
var USc_upgrade = {    


kVERSION_MAJOR : 2,
kVERSION_MINOR : 1,
kVERSION_REVISION : 0,

check : function()
{
    var me = USc_upgrade;
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
    if (!USc_file.updatescanDirExists()) {
        // Version 2.0.0+ expects webpage data to be in files, 
        // not embedded in RDF
        USc_file.createUpdatescanDir();
        nodes = USc_rdf.getRoot().getChildren();
        while (nodes.hasMoreElements()) {
            node = nodes.getNext();
            id = node.getValue();
            USc_rdf.modifyItem(id, "content", ""); // Not using this anymore
            USc_rdf.modifyItem(id, "changed", "0");
            USc_rdf.modifyItem(id, "error", "0");
            USc_rdf.modifyItem(id, "lastautoscan", "5 November 1978");
            filebase = USc_file.escapeFilename(id);
            USc_file.USwriteFile(filebase+".new", "**NEW**");// Mark as new
        }
        USc_rdf.save();
    }

    if (      versionMajor < 2 || 
              versionMajor == 2 && versionMinor < 0 ||
              versionMajor == 2 && versionMinor == 0 && versionRevision < 14) {       
        if (me.upgrade_2_0_14()) {
            prefs.setIntPref("versionMajor", me.kVERSION_MAJOR);
            prefs.setIntPref("versionMinor", me.kVERSION_MINOR);
            prefs.setIntPref("versionRevision", me.kVERSION_REVISION);
        }
    }
},

upgrade_2_0_14 : function()
{
    var me = USc_upgrade;
    var nodes;
    var node;
    var id;
    var ids = new Array();
    var file;
    var files = new Array();
    var ucaseFiles = new Array();
    var params;
    var label;
    var label2;
    var str=document.getElementById("updatescanStrings");

    // Previous versions had bug where multiple items used the same file.
    // First, check for duplications
    nodes = USc_rdf.getRoot().getChildren();
    if (!nodes.hasMoreElements()) {
        return true; // No need to do anything - nothing in the tree
    }
    while (nodes.hasMoreElements()) { // Get a list of filename bases
        node = nodes.getNext();
        id = node.getValue();
        ids.push(id);
        file = USc_file.oldEscapeFilename(id.substr(6))
        files.push(file);
        ucaseFiles.push(file.toUpperCase());
    }      
    label =  str.getString("upgradeLabel")+" (1/2)...";
    label2 = str.getString("timeWarning");
    params = {label:label, 
              label2:label2,
              callback:me.upgradeCheckDup, 
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
        USc_file.USrmFile(params.retData[i]+".old");
        USc_file.USrmFile(params.retData[i]+".new");
        USc_file.USrmFile(params.retData[i]+".dif");
    }

    // Rename existing cache files to use escaped uppercase id
    for (i in files) {
        var file = USc_file.escapeFilename(ids[i]);
        USc_file.USmvFile(files[i]+".old", file+".old");
        USc_file.USmvFile(files[i]+".new", file+".new");
        USc_file.USmvFile(files[i]+".dif", file+".dif");
        files[i] = file; // Used in the next step...
    }


    // 2.0.14+ expects diffs to be done during scan, not during display
    // Need to generate diffs now.
    label = str.getString("upgradeLabel")+" (2/2)...";
    label2 = str.getString("timeWarning");
    params = {label:label, 
              label2:label2,
              callback:me.upgradeDiff, 
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
},

upgradeDiff : function(filebase, data)
{
    // Create a diff file for the specified filebase
    var oldContent = USc_file.USreadFile(filebase+".old");
    var newContent = USc_file.USreadFile(filebase+".new");
    var diffContent = USc_diff.create(oldContent, newContent);
    USc_file.USwriteFile(filebase+".dif", diffContent);
    return null;
},

upgradeCheckDup : function(item, data)
{
    // Check if the item appears twice in the data
    if (data.indexOf(item.toUpperCase()) != 
        data.lastIndexOf(item.toUpperCase())) {
        return item;
    }
    return null;
}

}
}
