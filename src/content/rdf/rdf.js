if (typeof(USc_rdf_exists) != 'boolean') {
var USc_rdf_exists = true;
var USc_rdf = {    


dsource : null,
rootnode : null,
namespace : "http://www.updatescan.com/rdf/updatescan",

init : function(rdffile)
{
    var me = USc_rdf;
    me.dsource=new USc_RDFDataSource(rdffile);
    me.rootnode=me.dsource.getNode(me.namespace+"/all");
    if (!me.rootnode.isSeq()) {
        me.rootnode.makeSeq();
    }
    me.save();
},


check : function(rdffile)
// See if the RDF file is corrupted (if the first byte is 0x00)
// Workaround for bug #17952 until bookmark integration is implemented
{
    var inFile = USc_io.open(rdffile);
    if (!inFile.exists()) {
       return true; // It's ok if the file doesn't exist yet
    }
    var data = USc_io.readBinary(inFile);
    if (data == false || data.length == 0) {
        return true; // It's ok if the file is empty or can't be read (I guess)
    }
    if (data.charCodeAt(0) == 0x00) {
        return false; // First byte was zero - file is corrupt
    } else {
        return true;  // File is ok
    }
},

save : function()
{
    var me = USc_rdf;
    me.dsource.save()
},

getPath : function()
// gt the path to the user's home (profile) directory
{
    var rdffile = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(Components.interfaces.nsIProperties)
                            .get("ProfD", Components.interfaces.nsIFile);
    rdffile.append("updatescan.rdf");
    return rdffile;
},

getURI : function(file)
{
    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService)
                    .newFileURI(file);
    return uri.spec;
},
 
addItem : function()
{
    var me = USc_rdf;
    var node=me.dsource.getAnonymousNode();
    me.rootnode.addChild(node,true);
    me.dsource.save();
    return node.getValue();
},

modifyItem : function(id, field, value)
{
    var me = USc_rdf;
    me.dsource.getNode(id).addTargetOnce(me.namespace+"#"+field, value);
},

deleteItem : function(id)
{
    var me = USc_rdf;
    me.dsource.deleteRecursive(id);
},

queryItem : function(id, field, defaultValue)
{
    var me = USc_rdf;
    if (me.targetExists(id, field)) {
        return me.dsource.getNode(id).getTarget(me.namespace+"#"+field).getValue();
    } else {
        return defaultValue;
    }
},

targetExists : function(id, field)
{
    var me = USc_rdf;
    var item;

    item = me.dsource.getNode(id).getTarget(me.namespace+"#"+field);
    if (item == null) {
        return false;
    }
    return true;
},

moveItem : function(id, newIndex)
{
    var me = USc_rdf;
    var item = me.dsource.getNode(id);
    me.rootnode.removeChild(item);
    me.rootnode.addChildAt(item, newIndex+1); //rdfds index starts at 1, not 0
},

getRoot : function()
{
    var me = USc_rdf;
    return me.dsource.getNode(me.namespace+"/all");
}
}
}