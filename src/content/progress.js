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
    count = 0;
    cancelling = false;
    retData = new Array();
    timeoutID = setTimeout(timeout, 10) 
    window.arguments[0].retVal = false;
}

function timeout()
{
    var retVal;
    if (cancelling) {
        // Cancel prompt is open - spin until it closes
        timeoutID = setTimeout(timeout, 1000);
    } else {
        retVal = callback(items[count], data);
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
            timeoutID = setTimeout(timeout, 10);
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
