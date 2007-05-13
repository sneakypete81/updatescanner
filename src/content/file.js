function createUpdatescanDirectory()
{
    var dir = DirIO.open(prependUpdatescanPath(""));
    if (!dir.exists())
	DirIO.create(dir);
}

function writeFile(filename, data)
{
    var outFile = FileIO.open(prependUpdatescanPath(filename));
    return FileIO.write(outFile, data);    
}

function readFile(filename)
{
    var inFile = FileIO.open(prependUpdatescanPath(filename));
    if (!inFile.exists())
	return "";

    var data = FileIO.read(inFile);    
    if (data == false)
	return "";
    return data;
}

function rmFile(filename) 
{
    file = prependUpdatescanPath(filename);

    var aFile = Components.classes["@mozilla.org/file/local;1"].createInstance();
    if ( aFile instanceof Components.interfaces.nsILocalFile) {
	try {
	    aFile.initWithPath(file);
	    aFile.remove(false);
	} catch (err) {
	    return false;
	}
	return true;
    }
    return false;
}

function mvFile(sourcefile, destfile)
{
    // get a component for the file to copy
    var aFile = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Components.interfaces.nsILocalFile);
    if (!aFile) return false;

    // get a component for the directory to copy to
    var aDir = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(Components.interfaces.nsILocalFile);
    if (!aDir) return false;

    try {
	sourcefile = prependUpdatescanPath(sourcefile);
	destpath = prependUpdatescanPath("");

	// next, assign URLs to the file components
	aFile.initWithPath(sourcefile);
	aDir.initWithPath(destpath);

	// finally, move the file, and rename it
	aFile.moveTo(aDir,destfile);
    } catch (err) {
	return false;
    }

    return true;	
}

function prependUpdatescanPath(filename)
{
  // get the path to the user's home (profile) directory
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService( Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
    dir.append("updatescanner");
    dir.append(filename);
    return dir.path;
}