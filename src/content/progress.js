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

var timeoutID;
var callback;
var items;
var data;
var cancelPrompt;
var count;
var cancelling;
var retData;

// Pass in a label, an array of items, a data parameter and a callback function.
// A dialog is displayed, and every 10ms the callback is invoked
// with an item from the array (and the data parameter).
// If the callback returns a value, it is added to retData array, and returned
// once all items are finished.
// retVal is true if all items were processed, false if the user cancelled.

function initDialog()
{
    document.getElementById("progressLabel").value = 
               window.arguments[0].label;
    items =    window.arguments[0].items;
    data =     window.arguments[0].data;
    callback = window.arguments[0].callback;
    cancelPrompt = window.arguments[0].cancelPrompt;
    var label2 = window.arguments[0].label2;
    if (label2) {
        document.getElementById("progressLabel2").value = label2
        document.getElementById("progressLabel2").hidden = false;
    }

    count = 0;
    cancelling = false;
    retData = new Array();
    timeoutID = setTimeout(function(){timeout();}, 10) 
    window.arguments[0].retVal = false;
}

function timeout()
{
    var retVal;
    if (cancelling) {
        // Cancel prompt is open - spin until it closes
        timeoutID = setTimeout(function(){timeout();}, 1000);
    } else {
        try {
            retVal = callback(items[count], data);
        } catch (e) { // Silently fail
            retVal = null
        }
        if (retVal != null) {
            retData.push(retVal);
        }
        count++;
        document.getElementById("progressMeter").value =count*100/items.length;
        if (count >= items.length) {
            window.arguments[0].retData = retData;
            window.arguments[0].retVal = true;
            document.getElementById("dlgProgress").acceptDialog();
        } else {
            timeoutID = setTimeout(function(){timeout();}, 10);
        }
    }
}

function cancel()
{
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService);
    var flags = prompts.BUTTON_TITLE_YES  * prompts.BUTTON_POS_0 +
                prompts.BUTTON_TITLE_NO * prompts.BUTTON_POS_1 +
                prompts.BUTTON_POS_1_DEFAULT;
    var check= {value: false};
    cancelling = true;
    var button = prompts.confirmEx(window, "Update Scanner", 
                 cancelPrompt, flags,
                 "","","",null,check);
    cancelling = false;
    if (button == 1) { // Don't cancel
        return false;
    }
    
    if (timeoutID != null) {
        clearTimeout(timeoutID);
    }
    return true;
}
