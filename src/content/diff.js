var doc_loaded = false;

function loadDiff()
{
    var rdffile;

    if (doc_loaded == false) {
	doc_loaded = true;

	// Connect to the RDF file
	rdffile = getRDFuri();
	initRDF(rdffile);

	win = document.getElementById("diff-content");
	id = decodeURIComponent(document.location.search.substr(1));

	title       = queryRDFitem(id, "title", "No Title");
	url         = queryRDFitem(id, "url", "");
	content     = queryRDFitem(id, "content", "");
	old_content = queryRDFitem(id, "old_content", "");

	myDump(title);
	myDump(content);
	myDump(win.contentDocument);

	win.loadURI = "file:///c|/temp/Status-Q.htm";
    }
}

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

function displayDiffs(title, url, oldContent, newContent)
{ 
    string0 = stripScript(oldContent);
    string1 = stripScript(newContent);

 //   myDump("old:\n"+string0);
 //   myDump("new:\n"+string1);

    var htmlText = WDiffString(string0, string1);

    var win = getTopWin();
    var doc = win.content.document

    var file = FileIO.openTemp("UpdatescanDiff.htm");
    
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var URL = fileHandler.getURLSpecFromFile(file);
    
    data = "<base href='"+url+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td><font face='verdana' color=black size=-1>\n";

    if (oldContent == "**NEW**" || oldContent == "") {
	data += "The page below (<b>"+title+"</b>) has just been scanned for the first time.\n";
	htmlText = "New";//newContent;
    } else if (newContent == "**NEW**" || newContent == "") {
	data += title+" has not yet been scanned.\n";
        htmlText = "";	
    } else {
        data += "The page below (<b>"+title+"</b>) has changed since the last scan.\n";
        data += "The changes are <b style='color:black;background-color:#ffff66'>highlighted</b>.\n";
    }

    data += "</font></td>\n";
    data += "<td><font face='verdana' color=black size=-1>\n";
    data += "<a href='"+url+"'><font color=blue>[Remove&nbsp;highlighting]</font></a>\n";
    data += "</font></td></table>\n";
    data += "<hr>\n";

    data += htmlText;
    data += "<hr>\n";
    FileIO.write(file, data);

    doc.location=URL;
}

