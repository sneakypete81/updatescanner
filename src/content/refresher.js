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

function USc_refresher()
{    
  var me = this;
  
  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
  var prefName = ""
  var _branch = null;
  var callback = null;

  this.register = function(prefNamearg, callbackarg)
  {
    callback = callbackarg;
    prefName = prefNamearg;
    _branch = prefService.getBranch("extensions.updatescan.");
    _branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    _branch.addObserver("", this, false);
  }
  
  this.unregister = function()
  {
    if(!_branch) return;
    _branch.removeObserver("", this);
  }

  this.observe = function(aSubject, aTopic, aData)
  {
    if(aData == prefName && aTopic == "nsPref:changed") {
      callback();
    }
  }

  this.request = function()
  {
    var value = _branch.getBoolPref(prefName);
    _branch.setBoolPref(prefName, !value); // Invert the refresher preference
  }
}
