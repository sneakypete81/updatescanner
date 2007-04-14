function diffTest() 
{
//         0     1    2  3 4    5  6   7   8    9   10   11   12    13   14    
    diff0="Hello this is a test to see how well the diff will work. This quick first test has only words with no lines or tags, so might not work too well.";
//15 16   17  18   19    20   21 22    23 24    25 26    27  28   29  30

//         0     1    2  3 4  5   6   7    8      9         10   11     12   13
    diff1="Hello this is a to <script>does this get cut? </script>see how well Pete's fantastic diff engine will work the. This quick first test has only <i> words </i> with no lines or <b>tags</b>, so might not work too well.";
//14   15   16    17    18   19  20   21    22   23 24    25 26    27 28    29  30   31  32

    diff0 = readFile("c:\\Projects\\search.htm");
    diff1 = readFile("c:\\Projects\\search2.htm");

    displayDiffs("Political Compass", "http://www.politicalcompass.org/", diff0, diff1);

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

function displayDiffs(title, url, string0, string1)
{
    string0 = stripScript(string0);
    string1 = stripScript(string1);

    words0 = string0.split(" ");
    words1 = string1.split(" ");

    var win = getTopWin();
    var doc = win.content.document

    diffs = getDiffs(words0, words1);

    doc.writeln("<table><td><img src='file:///c|/updatescan.png'></td>");
    doc.writeln("<td>The page below (<b>"+title+"</b>) has changed since the last scan.");
    doc.writeln("The changes are <b style='color:black;background-color:#ffff66'>highlighted</b>.</td>");
    doc.writeln("<td><a href='"+url+"'>[Remove highlighting]</a></td></table>");
    doc.writeln("<hr>");

    word = 0;
    for (var i in diffs) {
        while (word<diffs[i][1]) {
            doc.write(" "+words1[word]);
            word++;
        }
        doc.writeln("<b ");
        doc.write("style='color:black;background-color:#ffff66'> ")
        while (word<diffs[i][3]) {
            doc.write(" "+words1[word]);
            word++;
        }
        doc.writeln("</b>");
    }
    doc.close();    
}

function getDiffs(words0, words1)
{
    var diffs = new Array();
    start0=0;
    start1=0;
    while (start0 < words0.length && start1 < words1.length) {
        // Find the next word that differs
	result = nextDiff(words0, words1, start0, start1)
	start0 = result[0]
	start1 = result[1]
 	end0 = start0;

        bestend0 = words0.length;
        bestend1 = words1.length;

        while (end0 < words0.length) {
            // Increment start1 until we find a match
            end1 = nextSame(words0, words1, end0, start1)
            if (end0 + end1 < bestend0 + bestend1) { // Closest match so far
                bestend0 = end0
                bestend1 = end1;
            }
            end0++;
        }

	diffs.push([start0, start1, bestend0, bestend1]);
        start0 = bestend0;
        start1 = bestend1;
    }
    return diffs;
}

function nextDiff(words0, words1, i0, i1)
{
    while (i0 < words0.length && i1 < words1.length) {

        if (words0[i0] != words1[i1]) {
            break;
        }
        i0++;
        i1++;
    }
    return [i0, i1];
}

function nextSame(words0, words1, i0, i1)
{
    while (i1 < words1.length) {
        if (words0[i0] == words1[i1]) {
            break;
        }
        i1++;
    }
    return i1;
}