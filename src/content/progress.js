var timeoutID = null;
var callback = null;
var data = null;
var cancelPrompt = "";
var count;
var cancelling = false;

// Pass in a label, an array of data, and a callback function.
// A dialog is displayed, and every 10ms the callback is invoked
// with an item from the array.

function initDialog()
{
    document.getElementById("progressLabel").value = 
               window.arguments[0].label;
    data =     window.arguments[0].data;
    callback = window.arguments[0].callback;
    cancelPrompt = window.arguments[0].cancelPrompt;
    count = 0;
    timeoutID = setTimeout(timeout, 10) 
}

function timeout()
{
    if (cancelling) {
        // Cancel prompt is open - spin until it closes
        timeoutID = setTimeout(timeout, 1000);
    } else {
        callback(data[count]);
        count++;
        document.getElementById("progressMeter").value =count*100/data.length;
        if (count >= data.length) {
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
