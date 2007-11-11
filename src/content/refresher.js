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


function USc_refresher(boolPrefNamearg, callbackarg)
{
    var me = this;
    var checkTimerRunning = false;
    var clearTimerRunning = false;
    var checkTimerID = null;
    var clearTimerID = null;
    var boolPrefName = boolPrefNamearg;
    var callback = callbackarg;

    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    try {
        prefs.getBoolPref(boolPrefName);
    } catch (e) { // pref doesn't exist - create it!
        prefs.setBoolPref(boolPrefName, false);
    }

    // Check for a refresh request every second
    this.start = function()
    {
        if (checkTimerRunning)
            me.stop();
        checkTimerID = setInterval(me.refresh, 1000);
        checkTimerRunning = true;
    }

    // Stop checking for refreshes
    this.stop = function()
    {
        clearInterval(checkTimerID);
        checkTimerRunning = false;
    }

    // Request a refresh across all browser windows
    this.request = function() 
    {
    //    myDump("req");
        prefs.setBoolPref(boolPrefName, true);
    
        // Clear the request 1 second later
        if (clearTimerRunning) {
            clearTimeout(clearTimerID);
        }
        clearTimerRunning = true;
        clearTimerID = setTimeout(me.clear, 1000);
    }

    // Called every second to see if a refresh is required
    this.refresh = function()
    {
        if (prefs.getBoolPref(boolPrefName)) {
            callback();
    
            // Clear the request 1 second later, just in case
            if (!clearTimerRunning) {
            clearTimerRunning = true;
            clearTimerID = setTimeout(me.clear, 1000);
            }
        }
        return false;
    }

    // Clear any pending refresh requests
    this.clear = function()
    {
        clearTimerRunning = false;
        prefs.setBoolPref(boolPrefName, false);
    }
}
