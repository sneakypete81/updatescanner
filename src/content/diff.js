
const kDiffView = 0;
const kNewView = 1;
const kOldView = 2;
const kUnscannedView = 3;

function createDiffs(oldContent, newContent)
{
    oldContent = stripScript(oldContent);
    newContent = stripScript(newContent);
    return WDiffString(oldContent, newContent);
}

function displayDiffs(title, sourceURL, oldContent, newContent, diffContent,
                      oldDate, newDate, numItems)
{
    var data; 
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler);

    if (numItems < 10) numItems = 10; // 10 temp files minimum

    if (newContent == "**NEW**") {
        var diffFile = openTempFile("UpdatescanDiff","htm");
        incrementTempFile(numItems);
        var diffURL = fileHandler.getURLSpecFromFile(diffFile);
    
        data = generateHeader(kUnscannedView, title, "", 
                              sourceURL, "", "", "");    
        FileIO.write(diffFile, data, "", "UTF-8");
    
        return diffURL;
    }
    
    oldContent = stripScript(oldContent);
    newContent = stripScript(newContent)

    var newFile  = openTempFile("UpdatescanNew","htm");
    var oldFile  = openTempFile("UpdatescanOld","htm"); 
    var diffFile = openTempFile("UpdatescanDiff","htm");
    incrementTempFile(numItems);
    var newURL  = fileHandler.getURLSpecFromFile(newFile);
    var oldURL  = fileHandler.getURLSpecFromFile(oldFile);
    var diffURL = fileHandler.getURLSpecFromFile(diffFile);

    data = generateHeader(kOldView, title, oldDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += oldContent;
    FileIO.write(oldFile, data, "", "UTF-8");

    data = generateHeader(kNewView, title, newDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += newContent;
    FileIO.write(newFile, data, "", "UTF-8");

    data = generateHeader(kDiffView, title, newDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += diffContent;
    FileIO.write(diffFile, data, "", "UTF-8");

    return diffURL;
}

function generateHeader(currentView, title, date, sourceURL, diffURL, oldURL, newURL)
{
    var data;
    var str = document.getElementById("updatescanStrings");
    var param;
    data = "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>"
    data += "<base href='"+sourceURL+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td>\n";
    data += "<span style='font: 12px verdana;color:black'>\n";

    switch (currentView) {
    case kDiffView:
        param = {title:title, timeDiff:date, 
                 highlightOn:"<b style='color:black;background-color:#ffff66'>",
                 highlightOff:"</b>"};
        data += str.getString("headerDiff").supplant(param);
        break;
    case kOldView:
        param = {title:title, timeDiff:date};
        data += str.getString("headerOld").supplant(param);
        break;
    case kNewView:
        param = {title:title, timeDiff:date};
        data += str.getString("headerNew").supplant(param);
        break;
    default:
        param = {title:title};
        data += str.getString("headerNotChecked").supplant(param);
    }
    
    data += "<br><b>"+str.getString("view")+":</b> [\n";
    if (currentView != kUnscannedView) {
        if (currentView == kOldView) {
            data += "<b>"+str.getString("oldPage")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+oldURL+"'>";
            data += str.getString("oldPage")+"</a> |\n";
        }
        if (currentView == kNewView) {
            data += "<b>"+str.getString("newPage")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+newURL+"'>";
            data += str.getString("newPage")+"</a> |\n";
        }
        if (currentView == kDiffView) {
            data += "<b>"+str.getString("changes")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+diffURL+"'>";
            data += str.getString("changes")+"</a> |\n";
        }
    }
    data += "<a style='color:blue;font-weight:normal' href='"+sourceURL+"'>"+sourceURL+"</a> ]\n"
    data += "</span></td></table>\n";
    data += "<hr>\n";
    data += "<div style='position:relative'>\n";
    return data;
}

