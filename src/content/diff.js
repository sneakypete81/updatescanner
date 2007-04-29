
const kDiffView = 0;
const kNewView = 1;
const kOldView = 2;

function diffTest() 
{
//         0     1    2  3 4    5  6   7   8    9   10   11   12    13   14    
    diff0="Hello ths is a <tag goes here />test to see how well the diff will work. This quick first test has only words with no lines or tags, so might not work too well.";
//15 16   17  18   19    20   21 22    23 24    25 26    27  28   29  30

//         0     1    2  3 4  5   6   7    8      9         10   11     12   13
    diff1="Hello this is a to <script>does this get cut? </script>see how well Pete's fantastic diff engine will work the. This quick first test has only <i> words </i> with no lines or <b>tags</b>, so might not work too well.";
//14   15   16    17    18   19  20   21    22   23 24    25 26    27 28    29  30   31  32

    diff2="Hello this is a <tag shouldall here />test to see how well the diff will work. This quick first test has only words with no lines or tags, so might not work too well.";

//    diff0 = readFile("c:\\Projects\\search.htm");
//    diff1 = readFile("c:\\Projects\\search2.htm");

    var win = getTopWin();
    d_doc = win.content.document;

    var htmlText = WDiffString(diff0, diff2);

    d_doc.writeln(htmlText);
    d_doc.close();

}

function readFile(str_Filename) 
{ 
    try { 
        var obj_File = Components.classes["@mozilla.org/file/local;1"].
               createInstance(Components.interfaces.nsILocalFile); 
        obj_File.initWithPath(str_Filename); 
        var obj_InputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
               createInstance(Components.interfaces.nsIFileInputStream); 
        obj_InputStream.init(obj_File,0x01,0444,null); 
        var obj_ScriptableIO = Components.classes["@mozilla.org/scriptableinputstream;1"].
               createInstance(Components.interfaces.nsIScriptableInputStream); 
        obj_ScriptableIO.init(obj_InputStream); 
    } catch (e) { 
        alert(e); 
    } 

    try { 
        var str = obj_ScriptableIO.read(obj_File.fileSize-1); 
    } catch (e) { 
        dump(e); 
    } 
    obj_ScriptableIO.close(); 
    obj_InputStream.close(); 
    return str;
}

function displayDiffs(title, sourceURL, oldContent, newContent)
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

/*    if (oldContent == "**NEW**" || oldContent == "") {
	data += "The page below (<b>"+title+"</b>) has just been scanned for the first time.\n";
	htmlText = "New";//newContent;
    } else if (newContent == "**NEW**" || newContent == "") {
	data += title+" has not yet been scanned.\n";
        htmlText = "";	
    } else {
*/

    data = generateHeader(kOldView, title, "2 days ago", sourceURL, diffURL, oldURL, newURL);    
    data += oldContent;
    FileIO.write(oldFile, data);

    data = generateHeader(kNewView, title, "2 minutes ago", sourceURL, diffURL, oldURL, newURL);    
    data += newContent;
    FileIO.write(newFile, data);

    data = generateHeader(kDiffView, title, "2 minutes ago", sourceURL, diffURL, oldURL, newURL);    
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