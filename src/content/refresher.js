function Refresher(boolPrefNamearg, callbackarg)
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
    //    myDump(".");
        if (prefs.getBoolPref(boolPrefName)) {
    //        myDump("ref\n");
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
    //    myDump("clear\n");
        prefs.setBoolPref(boolPrefName, false);
    }
}
