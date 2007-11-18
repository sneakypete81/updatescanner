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
    return prefPermanent.value ? 1 : 0;
  },

  writeNotificationsPermanent: function()
  {
    var displayRadio = document.getElementById("notificationsDisplayRadio");
    return displayRadio.selectedIndex == 1;
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
    return prefDefaultSound.value ? 0 : 1;
  },

  writeNotificationsDefaultSound: function()
  {
    var soundRadio = document.getElementById("notificationsSoundRadio");
    return soundRadio.selectedIndex == 0;
  },

  readNotificationsSoundFile: function()
  {
    var prefSoundFile = document.getElementById("notifications.soundFile");
    var soundFile = document.getElementById("notificationsSoundFile")

    soundFile.file = prefSoundFile.value;
    soundFile.label = prefSoundFile.valud.path;
    
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
  }
  

/*    var file = document.getElementById("extensions.hoge.testDir").value;
                if (file) {
                    var fileField = document.getElementById("myFileField");
                    fileField.file = file;
                    fileField.label = file.path;
                }
            }
            function selectDir() {
*/

}    
}
