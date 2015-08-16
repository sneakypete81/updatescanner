/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UpdateScanner.File = {

updatescanDirExists : function()
{
    var me = UpdateScanner.File;
    var dir = UpdateScanner.DirIo.open(me._prependUpdatescanPath(""));
    return (dir.exists())
},

createUpdatescanDir : function()
{
    var me = UpdateScanner.File;
    var dir = UpdateScanner.DirIo.open(me._prependUpdatescanPath(""));
    if (!dir.exists())
    UpdateScanner.DirIo.create(dir);
},

USwriteFile : function(filename, data)
{
    var me = UpdateScanner.File;
    var outFile = UpdateScanner.Io.open(me._prependUpdatescanPath(filename));
    return UpdateScanner.Io.write(outFile, data, "","UTF-8");
},

USreadFile : function(filename)
{
    var me = UpdateScanner.File;
    var inFile = UpdateScanner.Io.open(me._prependUpdatescanPath(filename));
    if (!inFile.exists()) {
       return "";
    }

    var data = UpdateScanner.Io.read(inFile, "UTF-8");
    if (data == false) {
       return "";
    }
    return data;
},

USrmFile : function(filename)
{
    var me = UpdateScanner.File;
    me.rmFile(me._prependUpdatescanPath(filename));
},

rmFile : function(filename)
{
    var aFile = Components.classes["@mozilla.org/file/local;1"].createInstance();
    if ( aFile instanceof Components.interfaces.nsILocalFile) {
        try {
            aFile.initWithPath(filename);
            aFile.remove(false);
        } catch (err) {
            return false;
        }
        return true;
    }
    return false;
},

USmvFile : function(sourcefile, destfile)
{
    var me = UpdateScanner.File;
    // get a component for the file to copy
    var aFile = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
    if (!aFile) return false;

    // get a component for the directory to copy to
    var aDir = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
    if (!aDir) return false;

    try {
        sourcefile = me._prependUpdatescanPath(sourcefile);
        var destpath = me._prependUpdatescanPath("");

        // next, assign URLs to the file components
        aFile.initWithPath(sourcefile);
        aDir.initWithPath(destpath);

        // finally, move the file, and rename it
        aFile.moveTo(aDir,destfile);
    } catch (err) {
        return false;
    }
    return true;
},

UScpFile : function(sourcefile, destfile)
{
    var me = UpdateScanner.File;
    return cpFile(me._prependUpdatescanPath(sourcefile),
                         me._prependUpdatescanPath(destfile));
},

cpFile : function(sourcefile, destfile)
{
    // get a component for the file to copy
    var aSrc = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
    if (!aSrc) return false;

    // get a component for the file to copy to
    var aDest = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
    if (!aDest) return false;

    try {
        // next, assign URLs to the file components
        aSrc.initWithPath(sourcefile);
        aDest.initWithPath(destfile);

        // finally, copy the file
        aSrc.copyTo(aDest.parent, aDest.leafName);
    } catch (err) {
        return false;
    }
    return true;
},

_prependUpdatescanPath : function(filename)
{
  // get the path to the user's home (profile) directory
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService( Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
    dir.append("updatescanner");
    dir.append(filename);
    return dir.path;
},

_prependTempPath : function(filename)
{
  // get the path to the temp directory
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService( Components.interfaces.nsIProperties)
                     .get("TmpD", Components.interfaces.nsIFile);
    dir.append(filename);
    return dir.path;
},

escapeFilename : function(filename)
// Remove all non-alphanumeric characters
{
    var output = ""
    var ch;
    for (var i=0; i<filename.length; i++) {
        ch = filename[i]
        if (ch.match(/[0-9a-zA-Z]/)) {
            output += ch;
        }
    }
    return output;
},

oldEscapeFilename : function(filename)
// Convert non-numeric/lowercase characters to ascii codes (" " => "_32")
{
    var output = ""
    var ch;
    for (var i=0; i<filename.length; i++) {
        ch = filename[i]
        if (ch.match(/[0-9a-z]/)) {
            output += ch;
        } else {
            output += "_"+ch.charCodeAt(0);
        }
    }
    return output;
},
openTempFile : function(fileBase, fileExt)
// Creates a temporary file with the specified base filename.
// The suffix of the filename is stored as a preference.
// This means temp files can be rotated, and don't accumulate!
{
    var me = UpdateScanner.File;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    try {
        var suffix = prefs.getIntPref("tempSuffix");
    } catch (e) { // pref doesn't exist - create it!
        var suffix = 0;
        prefs.setIntPref("tempSuffix", suffix);
    }

    var filename = fileBase + String(suffix);
    return UpdateScanner.Io.open(me._prependTempPath(filename)+"."+fileExt);
},

incrementTempFile : function(numItems)
// Increment the temp filename suffix 0,1... up to maximum of "numItems"
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    try {
        var suffix = prefs.getIntPref("tempSuffix");
    } catch (e) { // pref doesn't exist - create it!
        var suffix = 0;
    }
    suffix = suffix + 1;
    if (suffix > numItems) {
        suffix = 0;
    }
    prefs.setIntPref("tempSuffix", suffix);
},
};