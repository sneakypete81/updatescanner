
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
	var diffFile = FileIO.openTemp("UpdatescanDiff.htm");
	var diffURL = fileHandler.getURLSpecFromFile(diffFile);

	data = generateHeader(kUnscannedView, title, "", 
			      sourceURL, "", "", "");    
	FileIO.write(diffFile, data);

	return diffURL;
    }
	

    oldContent = stripScript(oldContent);
    newContent = stripScript(newContent)

    var diffContent = WDiffString(oldContent, newContent);

    var newFile  = FileIO.openTemp("UpdatescanNew.htm");
    var oldFile  = FileIO.openTemp("UpdatescanOld.htm"); 
    var diffFile = FileIO.openTemp("UpdatescanDiff.htm");
    var newURL  = fileHandler.getURLSpecFromFile(newFile);
    var oldURL  = fileHandler.getURLSpecFromFile(oldFile);
    var diffURL = fileHandler.getURLSpecFromFile(diffFile);

    data = generateHeader(kOldView, title, oldDate, 
			  sourceURL, diffURL, oldURL, newURL);    
    data += oldContent;
    FileIO.write(oldFile, data);

    data = generateHeader(kNewView, title, newDate, 
			  sourceURL, diffURL, oldURL, newURL);    
    data += newContent;
    FileIO.write(newFile, data);

    data = generateHeader(kDiffView, title, newDate, 
			  sourceURL, diffURL, oldURL, newURL);    
    data += diffContent;
    FileIO.write(diffFile, data);

    return diffURL;
}

function generateHeader(currentView, title, date, sourceURL, diffURL, oldURL, newURL)
{
    data = "<base href='"+sourceURL+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td>\n";
    data += "<span style='font: 12px verdana;color:black'>\n";
    if (currentView == kUnscannedView) {
	data += "The selected page ";
    } else {
	data += "The page below ";
    }
    data += "(<b>"+title+"</b>) ";
    if (currentView == kDiffView) {
	data += "was last scanned "+date+". The changes are ";
	data += "<b style='color:black;background-color:#ffff66'>highlighted</b>.\n";
    } else if (currentView == kOldView) {
	data += "is the old version of the webpage, scanned "+date+".\n";
    } else if (currentView == kNewView) {
	data += "is the new version of the webpage, scanned "+date+".\n";
    } else if (currentView == kUnscannedView) {
	data += "has not yet been checked. ";
	data += "Please click the <b>'Scan'</b> button on the left, and try again."; 
    }
    data += "<br><b>View:</b> [\n";
    if (currentView != kUnscannedView) {
	if (currentView == kOldView)
	    data += "<b>Old Page</b> |\n";
	else
	    data += "<a style='color:black;font-weight:normal' href='"+oldURL+"'>Old Page</a> |\n";
	if (currentView == kNewView)
	    data += "<b>New Page</b> |\n";
	else
	    data += "<a style='color:black;font-weight:normal' href='"+newURL+"'>New Page</a> |\n";
	if (currentView == kDiffView)
	    data += "<b>Changes</b> |\n";
	else
	    data += "<a style='color:black;font-weight:normal' href='"+diffURL+"'>Changes</a> |\n";
    }
    data += "<a style='color:black;font-weight:normal' href='"+sourceURL+"'>"+sourceURL+"</a> ]\n"
    data += "</span></td></table>\n";
    data += "<hr>\n";
    return data;
}

