
const kDiffView = 0;
const kNewView = 1;
const kOldView = 2;
const kUnscannedView = 3;


function displayDiffs(title, sourceURL, oldContent, newContent, oldDate, newDate)
{ 
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler);

    if (newContent == "**NEW**") {
    var diffFile = openTempFile("UpdatescanDiff","htm");
    incrementTempFile();
    var diffURL = fileHandler.getURLSpecFromFile(diffFile);

    data = generateHeader(kUnscannedView, title, "", 
                  sourceURL, "", "", "");    
    FileIO.write(diffFile, data, "", "UTF-8");

    return diffURL;
    }
    

    oldContent = stripScript(oldContent);
    newContent = stripScript(newContent)

    var diffContent = WDiffString(oldContent, newContent);

    var newFile  = openTempFile("UpdatescanNew","htm");
    var oldFile  = openTempFile("UpdatescanOld","htm"); 
    var diffFile = openTempFile("UpdatescanDiff","htm");
    incrementTempFile();
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
    data = "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>"
    data += "<base href='"+sourceURL+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td>\n";
    data += "<span style='font: 12px verdana;color:black'>\n";
    if (currentView == kUnscannedView) {
    data += str.getString("theSelectedPage")+" ";
    } else {
    data += str.getString("thePageBelow")+" ";
    }
    data += "(<b>"+title+"</b>) ";
    if (currentView == kDiffView) {
    data += str.getString("wasLastScanned")+" "+date+". ";
    data += str.getString("theChangesAre")+" ";
    data += "<b style='color:black;background-color:#ffff66'>";
    data += str.getString("highlighted")+"</b>.\n";
        
    } else if (currentView == kOldView) {
    data += str.getString("oldVersion")+" "+date+".\n";
    } else if (currentView == kNewView) {
    data += str.getString("newVersion")+" "+date+".\n";
    } else if (currentView == kUnscannedView) {
    data += str.getString("notChecked");
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

