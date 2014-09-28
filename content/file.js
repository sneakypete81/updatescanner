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