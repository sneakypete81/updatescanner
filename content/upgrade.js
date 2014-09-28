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
 * Locale checking from Martijn Kooij's Quick Locale Switcher
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

UpdateScanner.Upgrade = {


VERSION : "3.2.0",

check : function()
{
    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");

    if (!UpdateScanner.File.updatescanDirExists()) {
        UpdateScanner.File.createUpdatescanDir();
    }

    if (this.isNewInstall()) {
        this.createRootBookmark();
        this.createUSBookmark();
        UpdateScanner.Toolbar.installAddonbarIcon();
        this.updateVersion()
        return;
    }

    if (this.isVersionBefore("3.0.5")) {
        this.upgrade_3_0_5();
        this.updateVersion();
    }

    if (this.isVersionBefore("3.1.4")) {
        UpdateScanner.Toolbar.installAddonbarIcon();
    }

    if (this.isVersionBefore(this.VERSION)) {
        this.updateVersion()
    }
},

isNewInstall : function()
{
    return this.getVersion() == ""
},

isVersionBefore : function(version)
{
    var comparator = Cc["@mozilla.org/xpcom/version-comparator;1"].
        getService(Ci.nsIVersionComparator);
    var lastVersion = this.getVersion();

    return (comparator.compare(lastVersion, version) < 0);
},

getVersion : function()
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    if (prefs.prefHasUserValue("version"))
        return prefs.getCharPref("version");

    // Also check old version preferences
    try {
        var versionMajor = prefs.getIntPref("versionMajor");
        var versionMinor = prefs.getIntPref("versionMinor");
        var versionRevision = prefs.getIntPref("versionRevision");
    } catch (e) {
        // New installation
        return "";
    }
    return versionMajor + "." + versionMinor + "." + versionRevision;
},

updateVersion : function(version)
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                 getService(Components.interfaces.nsIPrefService).
                 getBranch("extensions.updatescan.");

    prefs.setCharPref("version", this.VERSION)

    if (prefs.prefHasUserValue("versionMajor")) {
        prefs.setIntPref("versionMajor", 0);
        prefs.setIntPref("versionMinor", 0);
        prefs.setIntPref("versionRevision", 0);
    }
},

upgrade_3_0_5 : function()
// For 3.0.5, make sure the root folder doesn't have the organiser query annotation
// (this was originally copied from the Sage source, but seems to be redundant,
//  and causes problems with FF3.5)
{
    var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    var strings = gBundle.createBundle("chrome://updatescan/locale/updatescan.properties");
    var folder_name = strings.GetStringFromName("rootFolderName");
    var folder_id = UpdateScanner.Places.getRootFolderId()

    try {
        UpdateScanner.Places.removeAnno(folder_id, UpdateScanner.Places.ORGANIZER_QUERY_ANNO);
    } catch (e) {
    }

    try {
        UpdateScanner.Updatescan.myDump(UpdateScanner.Places.getTitle());
    } catch (e) {
        UpdateScanner.Places.setTitle(folder_id, folder_name);
    }
},

createRootBookmark : function ()
{
    try {
        UpdateScanner.Places.getRootFolderId();
    } catch (e) {
        UpdateScanner.Places.createRootFolder();
    }
},

createUSBookmark : function ()
{
    var updatescanURL="https://addons.mozilla.org/firefox/addon/update-scanner/";
    var bookmarkId = UpdateScanner.Places.addBookmark("Update Scanner Website", updatescanURL);
    // Set default scan to manual only, to prevent excessive traffic
    UpdateScanner.Places.modifyAnno(bookmarkId, UpdateScanner.Places.ANNO_SCAN_RATE_MINS, 0);
},
};