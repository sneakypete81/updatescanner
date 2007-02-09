var dsource = null;
var rootnode = null;
var namespace = "http://www.updatescan.com/rdf/updatescan"

function initRDF(rdffile)
{
    dsource=new RDFDataSource(rdffile);
    rootnode=dsource.getNode(namespace+"/all");
    if (!rootnode.isSeq())
        rootnode.makeSeq();
}

function saveRDF(rdffile)
{
    dsource.save()
}

function getRDFuri()
{
    // Get path to the user's extension install directory
    const id = "{c07d1a49-9894-49ff-a594-38960ede8fb9}";
    var rdffile = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id); 

  // get the path to the user's home (profile) directory
    var rdffile = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(Components.interfaces.nsIProperties)
                            .get("ProfD", Components.interfaces.nsIFile);

    rdffile.append("updatescan.rdf");

    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService)
                    .newFileURI(rdffile);

    return uri.spec;
}
function addRDFitem()
{
    var node=dsource.getAnonymousNode();
    rootnode.addChild(node,true);
    dsource.save();
    return node.getValue();
}

function modifyRDFitem(id, field, value)
{
    dsource.getNode(id).addTargetOnce(namespace+"#"+field, value);
}

function deleteRDFitem(id)
{
    dsource.deleteRecursive(id);
}

function queryRDFitem(id, field, defaultValue)
{
    if (targetExists(id, field))
	return dsource.getNode(id).getTarget(namespace+"#"+field).getValue();
    else
	return defaultValue;
}

function targetExists(id, field)
{
    var item;

    item = dsource.getNode(id).getTarget(namespace+"#"+field);
    if (item == null)
	return false;
    return true;
}

function getRDFroot()
{
    return dsource.getNode(namespace+"/all");
}