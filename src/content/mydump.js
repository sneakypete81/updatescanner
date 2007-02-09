function myDump(aMessage) {
    dump(aMessage);
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                         .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("UpdateScan: " + aMessage);
}

