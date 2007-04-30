
const kDiffView = 0;
const kNewView = 1;
const kOldView = 2;


function displayDiffs(title, sourceURL, oldContent, newContent, oldDate, newDate)
{ 
    oldContent = stripScript(oldContent);
    newContent = stripScript(newContent);

    var diffContent = WDiffString(oldContent, newContent);

    var win = getTopWin();
    var doc = win.content.document

    var diffFile = FileIO.openTemp("UpdatescanDiff.htm");
    var oldFile  = FileIO.openTemp("UpdatescanOld.htm");
    var newFile  = FileIO.openTemp("UpdatescanNew.htm");

    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var diffURL = fileHandler.getURLSpecFromFile(diffFile);
    var oldURL  = fileHandler.getURLSpecFromFile(oldFile);
    var newURL  = fileHandler.getURLSpecFromFile(newFile);


    data = generateHeader(kOldView, title, oldDate, sourceURL, diffURL, oldURL, newURL);    
    data += oldContent;
    FileIO.write(oldFile, data);

    data = generateHeader(kNewView, title, newDate, sourceURL, diffURL, oldURL, newURL);    
    data += newContent;
    FileIO.write(newFile, data);

    data = generateHeader(kDiffView, title, newDate, sourceURL, diffURL, oldURL, newURL);    
    data += diffContent;
    FileIO.write(diffFile, data);

    doc.location=diffURL;
}

function generateHeader(currentView, title, date, sourceURL, diffURL, oldURL, newURL)
{
    data = "<base href='"+sourceURL+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td>\n";
    data += "<span style='font: 12px verdana';>\n"
    data += "The page below (<b>"+title+"</b>) "
    if (currentView == kDiffView) {
	data += "has changed. It was last checked "+date+". The changes are ";
	data += "<b style='color:black;background-color:#ffff66'>highlighted</b>.\n";
    } else if (currentView == kOldView) {
	data += "is the old version of the page, from "+date+".\n";
    } else if (currentView == kNewView) {
	data += "is the new version of the page, from "+date+".\n";
    }
    data += "<br><b>View:</b> [\n";
    if (currentView == kOldView)
	data += "<b>Old Page</b> |\n";
    else
	data += "<a href='"+oldURL+"'>Old Page</a> |\n";
    if (currentView == kNewView)
	data += "<b>New Page</b> |\n";
    else
	data += "<a href='"+newURL+"'>New Page</a> |\n";
    if (currentView == kDiffView)
	data += "<b>Changes</b> |\n";
    else
	data += "<a href='"+diffURL+"'>Changes</a> |\n";
    data += "<a href='"+sourceURL+"'>"+sourceURL+"</a> ]\n"
    data += "</span></td></table>\n";
    data += "<hr>\n";
    return data;
}
