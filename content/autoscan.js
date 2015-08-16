/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UpdateScanner.Autoscan = {

checkTimerRunning : false,
checkTimerID : null,
scan : null,
numChanges : 0,
callback : null,

// Start checking if scanning is required every minute
start : function(callbackarg)
{
    var me = UpdateScanner.Autoscan;
    me.callback = callbackarg;
    if (me.checkTimerRunning) {
        me.stop();
    }
    me.checkTimerID = setInterval(function(){me._check();}, 60*1000);
    me.checkTimerRunning = true;
},

// Stop checking
stop : function()
{
    var me = UpdateScanner.Autoscan;
    me.callback=null;
    clearInterval(me.checkTimerID);
    me.checkTimerRunning = false;
},

// Called every minute to see if a scan is required
_check : function()
{
    var me = UpdateScanner.Autoscan;
    var prefBranch = (Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService).
                      getBranch("extensions.updatescan."));

    // Only scan if we're enabled
    if (prefBranch.getBoolPref("scan.enable")) {

        me.scan = new UpdateScanner.Scan.scanner();
        var numItems = me.scan.addItems(UpdateScanner.Places.getRootFolderId(), true);

//    var now = new Date();
//    UpdateScanner.Updatescan.myDump(now.toString()+":"+numItems+" items to scan\n");

        if (numItems == 0) {
            me.callback(0);
        }
        me.numChanges = 0;
        me.scan.start(me._scanChanged,
                      me._scanFinished,
                      me._scanProgress,
                      me._encodingChanged);
    }
},

_scanChanged : function(id, new_content, status, statusText, headerText)
{
    var me = UpdateScanner.Autoscan;
    if (UpdateScanner.Scan.processScanChange(id, new_content, status, statusText, headerText)) {
        me.numChanges++;
    }
},

_encodingChanged : function(id, encoding)
// Called when encoding is detected for a page marked for auto-detect encoding
{
    UpdateScanner.Places.modifyAnno(id, UpdateScanner.Places.ANNO_ENCODING, encoding);
},


_scanFinished : function()
{
    var me = UpdateScanner.Autoscan;
    me.callback(me.numChanges);
},

_scanProgress : function(title,value, max)
{
}
};
