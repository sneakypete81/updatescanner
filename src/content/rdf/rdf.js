var dsource = null;
var rootnode = null;
var namespace = "http://www.updatescan.com/rdf/updatescan"

function initRDF(rdffile)
{
    dsource=new RDFDataSource(rdffile);
    rootnode=dsource.getNode(namespace+"/all");
    if (!rootnode.isSeq())
        rootnode.makeSeq();
    saveRDF();
}

function saveRDF()
{
    dsource.save()
}

function getRDFuri()
{
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

function moveRDFitem(id, newIndex)
{
    var item = dsource.getNode(id);
    rootnode.removeChild(item);
    rootnode.addChildAt(item, newIndex+1); //rdfds index starts at 1, not 0
}

function getRDFroot()
{
    return dsource.getNode(namespace+"/all");
}
