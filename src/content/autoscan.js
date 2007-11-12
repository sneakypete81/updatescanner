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
 
if (typeof(USc_autoscan_exists) != 'boolean') {
var USc_autoscan_exists = true;
var USc_autoscan = {    

checkTimerRunning : false,
checkTimerID : null,
scan : null,
numChanges : 0,
callback : null,

// Start checking if scanning is required every minute
start : function(callbackarg)
{
    var me = USc_autoscan;    
    me.callback = callbackarg;
    if (me.checkTimerRunning) {
        me.stop();
    }
    me.checkTimerID = setInterval(me._check, 60*1000);
    me.checkTimerRunning = true;
},

// Stop checking
stop : function()
{
    var me = USc_autoscan;    
    me.callback=null;
    clearInterval(me.checkTimerID);
    me.checkTimerRunning = false;
},

// Called every minute to see if a scan is required
_check : function()
{
    var me = USc_autoscan;
    var id;
    var pages;
    var lastAutoScan;
    var scanRate;
    var now;
    var doScan = false;
    var filebase;
    var ignoreNumbers;

    pages = USc_rdf.getRoot().getChildren();

    me.scan = new USc_scanner();
    now = new Date();

    while (pages.hasMoreElements()) {
        id = pages.getNext().getValue();
        scanRate = USc_rdf.queryItem(id, "scanratemins", "0");
        if (scanRate != "0") {
            lastAutoScan = USc_rdf.queryItem(id, "lastautoscan", "");
            if (lastAutoScan == "") {
                lastAutoScan = "5/11/1978";
            }
            lastAutoScan = new Date(lastAutoScan);
            if (now - lastAutoScan > scanRate*1000*60) {
                USc_rdf.modifyItem(id, "lastautoscan", now.toString());
                USc_rdf.save();
                doScan = true;
                filebase=USc_file.escapeFilename(id)
                if (USc_rdf.queryItem(id, "ignoreNumbers", "false") == "true") {
                    ignoreNumbers = true;
                } else {
                    ignoreNumbers = false;
                }

                me.scan.addURL(id, USc_rdf.queryItem(id, "title", "No Title"), 
                            USc_rdf.queryItem(id, "url", ""), 
                            USc_file.USreadFile(filebase+".new"),
                            USc_rdf.queryItem(id, "threshold", 100),                                
                            ignoreNumbers,
                            USc_rdf.queryItem(id, "encoding", "auto"));
            }
        }
    }

    if (doScan) {
        me.numChanges = 0;
        me.scan.start(me._scanChanged, 
               me._scanFinished, 
               me._scanProgress,
               me._encodingChanged);
    } else {
        me.callback(0); // No changes
    }
},

_scanChanged : function(id, new_content, status, statusText, headerText)
{
    var me = USc_autoscan;    
    if (USc_processScanChange(id, new_content, status, statusText, headerText)) {
        me.numChanges++;
    }
},

_encodingChanged : function(id, encoding)
// Called when encoding is detected for a page marked for auto-detect encoding
{
    USc_rdf.modifyItem(id, "encoding", encoding);
},


_scanFinished : function()
{
    var me = USc_autoscan;    
    me.callback(me.numChanges);
},

_scanProgress : function(value, max)
{
}

}
}
