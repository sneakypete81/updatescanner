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

if (typeof(USc_pref_exists) != 'boolean') {
var USc_pref_exists = true;
var USc_pref = {
  
  onPrefLoad: function ()
  {
    // Mac bug: dialog auto sizing doesn't work for some reason.
    window.sizeToContent();
  },
  
  readNotificationsEnable: function ()
  {
    var prefEnable = document.getElementById("notifications.enable");
    var displayRadio = document.getElementById("notificationsDisplayRadio");
    var displayTimeEntry = document.getElementById("notificationsDisplayTimeEntry") 
    var displayTimeEntryLabel = document.getElementById("notificationsDisplayTimeEntryLabel") 

    displayRadio.disabled = !prefEnable.value;
    displayTimeEntry.disabled = !prefEnable.value;
    displayTimeEntryLabel.disabled = !prefEnable.value;

    // don't override the preference's value in UI
    return undefined;
  },

  readNotificationsPermanent: function()
  {
    var prefPermanent = document.getElementById("notifications.permanent");
    return prefPermanent.value ? "permanent" : "timed";
  },

  writeNotificationsPermanent: function()
  {
    var displayRadio = document.getElementById("notificationsDisplayRadio");
    return displayRadio.selectedItem.value == "permanent";
  },
  
  readNotificationsPlaySound: function()
  {
    var prefPlaySound = document.getElementById("notifications.playSound");
    var soundRadio = document.getElementById("notificationsSoundRadio");
    var soundBrowse = document.getElementById("notificationsSoundBrowse") 

    soundRadio.disabled = !prefPlaySound.value;
    soundBrowse.disabled = !prefPlaySound.value;      
    return undefined;
  },   

  readNotificationsDefaultSound: function()
  {
    var prefDefaultSound = document.getElementById("notifications.defaultSound");
    return prefDefaultSound.value ? "default" : "file";
  },

  writeNotificationsDefaultSound: function()
  {
    var soundRadio = document.getElementById("notificationsSoundRadio");
    return soundRadio.selectedItem.value == "default";
  },

  readNotificationsSoundFile: function()
  {
    var prefSoundFile = document.getElementById("notifications.soundFile");
    var soundFile = document.getElementById("notificationsSoundFile")

    soundFile.file = prefSoundFile.value;
    // The following is necessary for WinXP, or the label isn't updated properly.
    // Test for null, to prevent MacOS errors.
    if (soundFile.file) {
      soundFile.label = soundFile.file.path;
    }
  },
  
  soundBrowseClick: function()
  {
    var prefDefaultSound = document.getElementById("notifications.defaultSound");
    var prefSoundFile = document.getElementById("notifications.soundFile");
    var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance(Components.interfaces.nsIFilePicker);
    filePicker.init(window,"Update Scanner", filePicker.modeOpen);
    if (filePicker.show() == filePicker.returnOK) {
      prefSoundFile.value = filePicker.file;
      prefDefaultSound.value = false;
    }
  },  

  checkOS : function()
  {
    try {
      var platform = window.navigator.platform.toLowerCase();
      if (platform.indexOf('win') != -1)
        return 'windows';
      else if (platform.indexOf('mac') != -1)
        return 'macintosh';
      else if (platform.indexOf('linux') != -1)
        return 'linux';
     
      return 'unknown (' + platform + ')';
    }
    catch (e) {}
    return 'unknown';
  },
  
  openHelp : function()
  {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefBranch);
    var url="http://sneakypete81.github.io/updatescanner/";

    // non-instant apply prefwindows are usually modal, so we can't open in the topmost window, 
    // since its probably behind the window.
    var instantApply = prefs.getBoolPref("browser.preferences.instantApply");
    var where = instantApply ? "tab" : "window";

    openUILinkIn(url, where);
  }

}    
}
