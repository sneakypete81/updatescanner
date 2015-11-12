/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UpdateScanner.Pref = {

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
    if (prefs.getBoolPref("browser.preferences.instantApply")) {
      openUILinkIn(url, "tab");
    } else {
      openUILinkIn(url, "window");
    }
  },

};