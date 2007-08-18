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
 
function Autoscan()
{
    var auto = this;
    var checkTimerRunning = false;
    var checkTimerID = null;
    var scan = null;
    var numChanges;
    var callback;

    // Start checking if scanning is required every minute
    this.start = function(callbackarg)
    {
        callback = callbackarg;
        if (checkTimerRunning) {
            auto.stop();
        }
        checkTimerID = setInterval(auto.check, 60*1000);
        checkTimerRunning = true;
    
        //Don't check straight away - wait for 1 minute.
        //auto.check();
    }

    // Stop checking
    this.stop = function()
    {
        callback=null;
        clearInterval(checkTimerID);
        checkTimerRunning = false;
    }

    // Called every minute to see if a scan is required
    this.check = function()
    {
        var id;
        var pages;
        var lastAutoScan;
        var scanRate;
        var now;
        var doScan = false;
        var filebase;
        var ignoreNumbers;
    
        pages = getRDFroot().getChildren();
    
        scan = new Scanner();
        now = new Date();
    
        while (pages.hasMoreElements()) {
            id = pages.getNext().getValue();
            scanRate = queryRDFitem(id, "scanratemins", "0");
            if (scanRate != "0") {
                lastAutoScan = queryRDFitem(id, "lastautoscan", "");
                if (lastAutoScan == "") {
                    lastAutoScan = "5/11/1978";
                }
                lastAutoScan = new Date(lastAutoScan);
                if (now - lastAutoScan > scanRate*1000*60) {
                    modifyRDFitem(id, "lastautoscan", now.toString());
                    saveRDF();
                    doScan = true;
                    filebase=escapeFilename(id)
                    if (queryRDFitem(id, "ignoreNumbers", "false") == "true") {
                        ignoreNumbers = true;
                    } else {
                        ignoreNumbers = false;
                    }

                    scan.addURL(id, queryRDFitem(id, "title", "No Title"), 
                                queryRDFitem(id, "url", ""), 
                                readFile(filebase+".new"),
                                queryRDFitem(id, "threshold", 100),                                
                                ignoreNumbers,
                                queryRDFitem(id, "encoding", "auto"));
                }
            }
        }
    
        if (doScan) {
            numChanges = 0;
            scan.start(auto.scanChanged, 
                   auto.scanFinished, 
                   auto.scanShowProgress);
        } else {
            callback(0); // No changes
        }
    }

    this.scanChanged = function(id, new_content, status, statusText, headerText)
    {
        if (processScanChange(id, new_content, status, statusText, headerText)) {
            numChanges++;
        }
    }

    this.scanFinished = function()
    {
        callback(numChanges);
    }

    this.scanShowProgress = function(value, max)
    {
    }

}

