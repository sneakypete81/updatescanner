/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Sage.
 *
 * The Initial Developer of the Original Code is
 * Peter Andrews <petea@jhu.edu>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Peter Andrews <petea@jhu.edu>
 * Erik Arvidsson <erik@eae.net>
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
 *
 * ***** END LICENSE BLOCK ***** */

var sageFolderID;

var chkUserCssEnable;
var txtUserCssPath;
var chkAllowEContent;
var chkRenderFeeds;
var chkTwelveHourClock;
var feedItemOrder;
var feedDiscoveryMode;

var gList;
var strRes;

var logger;

function init() {
  var Logger = new Components.Constructor("@sage.mozdev.org/sage/logger;1", "sageILogger", "init");
  logger = new Logger();

  strRes = document.getElementById("strRes");

  try {
    sageFolderID = SageUtils.getSageRootFolderId();
  } catch (e) {
    logger.error(e);
  }

  gList = document.getElementById("select-menu");

  chkUserCssEnable = document.getElementById("chkUserCssEnable");
  chkUserCssEnable.checked = SageUtils.getSagePrefValue(SageUtils.PREF_USER_CSS_ENABLE);

  txtUserCssPath = document.getElementById("txtUserCssPath");
  txtUserCssPath.value = SageUtils.getSagePrefValue(SageUtils.PREF_USER_CSS_PATH);

  chkAllowEContent = document.getElementById("chkAllowEContent");
  chkAllowEContent.checked = SageUtils.getSagePrefValue(SageUtils.PREF_ALLOW_ENCODED_CONTENT);

  chkRenderFeeds = document.getElementById("chkRenderFeeds");
  chkRenderFeeds.checked = SageUtils.getSagePrefValue(SageUtils.PREF_RENDER_FEEDS);

  chkTwelveHourClock = document.getElementById("chkTwelveHourClock");
  chkTwelveHourClock.checked = SageUtils.getSagePrefValue(SageUtils.PREF_TWELVE_HOUR_CLOCK);

  feedItemOrder = document.getElementById("feedItemOrder");
  feedItemOrder.value = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER);

  feedDiscoveryMode = document.getElementById("feedDiscoveryMode");
  feedDiscoveryMode.value = SageUtils.getSagePrefValue(SageUtils.PREF_FEED_DISCOVERY_MODE);

  setDisabled();

  setTimeout(fillSelectFolderMenupopup, 0);
}

function accept() {
  SageUtils.setSageRootFolderId(sageFolderID);
  SageUtils.setSagePrefValue(SageUtils.PREF_USER_CSS_ENABLE, chkUserCssEnable.checked);
  SageUtils.setSagePrefValue(SageUtils.PREF_USER_CSS_PATH, txtUserCssPath.value);
  SageUtils.setSagePrefValue(SageUtils.PREF_ALLOW_ENCODED_CONTENT, chkAllowEContent.checked);
  SageUtils.setSagePrefValue(SageUtils.PREF_RENDER_FEEDS, chkRenderFeeds.checked);
  SageUtils.setSagePrefValue(SageUtils.PREF_TWELVE_HOUR_CLOCK, chkTwelveHourClock.checked);
  SageUtils.setSagePrefValue(SageUtils.PREF_FEED_ITEM_ORDER, feedItemOrder.value);
  SageUtils.setSagePrefValue(SageUtils.PREF_FEED_DISCOVERY_MODE, feedDiscoveryMode.value);
}

function selectFolder(aEvent){
  sageFolderID = aEvent.target.id;
}

function setDisabled() {
  txtUserCssPath.disabled = !chkUserCssEnable.checked;
  document.getElementById("btnBrowseCss").disabled = !chkUserCssEnable.checked;
}

function browseCss() {
  var fpicker = Components.classes["@mozilla.org/filepicker;1"]
          .createInstance(Components.interfaces.nsIFilePicker);
  fpicker.init(window, strRes.getString("css_select_file"), fpicker.modeOpen);
  fpicker.appendFilter(strRes.getString("css_css_file") + " (*.css)", "*.css");
  fpicker.appendFilters(fpicker.filterAll);

  var showResult = fpicker.show();
  if(showResult == fpicker.returnOK) {
    txtUserCssPath.value = fpicker.file.path;
  }
}

function fillSelectFolderMenupopup () {
  var popup = document.getElementById("select-folder");

  // clearing the old menupopup
  while (popup.hasChildNodes()) {
    popup.removeChild(popup.firstChild);
  }

  var element = document.createElementNS(SageUtils.XUL_NS, "menuitem");
  element.setAttribute("label", PlacesUtils.bookmarks.getItemTitle(PlacesUtils.bookmarks.bookmarksMenuFolder));
  element.setAttribute("id", PlacesUtils.bookmarks.bookmarksMenuFolder);
  popup.appendChild(element);

  var query = PlacesUtils.history.getNewQuery();
  query.setFolders([PlacesUtils.bookmarks.bookmarksMenuFolder], 1);
  var result = PlacesUtils.history.executeQuery(query, PlacesUtils.history.getNewQueryOptions());

  var folder = result.root;
  fillFolder(popup, folder, 1);
  
  if(gList.selectedIndex == -1) {
    gList.selectedIndex = 0;
    sageFolderID = PlacesUtils.bookmarks.bookmarksMenuFolder;
  }
}

function fillFolder(aPopup, aFolder, aDepth) {
  aFolder.containerOpen = true;
  for (var c = 0; c < aFolder.childCount; c++) {
    var child = aFolder.getChild(c);
    if (child.type == Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER &&
      !PlacesUtils.nodeIsLivemarkContainer(child)) {
      child.QueryInterface(Ci.nsINavHistoryContainerResultNode);
      var element = document.createElementNS(SageUtils.XUL_NS, "menuitem");
      element.setAttribute("label", new Array(aDepth + 1).join("   ") + child.title);
      element.setAttribute("id", child.itemId);
      aPopup.appendChild(element);
      if (child.itemId == sageFolderID) {
        gList.selectedItem = element;
      }
      fillFolder(aPopup, child, ++aDepth);
      --aDepth;
    }
  }
}
