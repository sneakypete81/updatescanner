/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is rdfds
 *
 * The Initial Developer of the Original Code is Neil Deakin
 * Portions created by Neil Deakin are Copyright (C) 2002 Neil Deakin.
 * All Rights Reserved.
 *
 * Contributor(s):
 */

/* This is a library for easier access to RDF datasources and resources.
 * It contains four objects, USc_RDFDataSource, USc_RDFNode, USc_RDFLiteral. and
 * USc_RDFEnumerator.
 *
 * An RDF DataSource is a graph of nodes and literals. The constructor
 * for USc_RDFDataSource takes one argument, a URI of an RDF file to use.
 * If the URI exists, the contents of the RDF file are loaded. If it
 * does not exist, resources can be added to it and then written using
 * this save method. If the URL argument is null, a blank datasource
 * is created.
 *
 * This library is designed for convenience not for efficiency.
 *
 * The API is documented at:
 *   http://www.xulplanet.com/tutorials/xultu/rdfds/
 *
 * Example:
 *
 * var ds=new USc_RDFDataSource("file:///main/mozilla/mimtest.rdf");
 * var node=ds.getNode("http://www.example.com/sample");
 * var child=ds.getNode("http://www.example.com/child");
 * child=node.addChild(child);
 * child.addTarget("http://www.xulplanet.com/rdf/xpimaker#appname","Find Files");
 * ds.save();
 *
 */

var USc_RDFService = "@mozilla.org/rdf/rdf-service;1";
USc_RDFService = Components.classes[USc_RDFService].getService();
USc_RDFService = USc_RDFService.QueryInterface(Components.interfaces.nsIRDFService);

var USc_RDFContainerUtilsService = "@mozilla.org/rdf/container-utils;1";
USc_RDFContainerUtilsService = Components.classes[USc_RDFContainerUtilsService].getService();
USc_RDFContainerUtilsService = USc_RDFContainerUtilsService.QueryInterface(Components.interfaces.nsIRDFContainerUtils);

/* RDFLoadObserver
 *   this object is necessary to listen to RDF files being loaded. The Init
 *   function should be called to initialize the callback when the RDF file is
 *   loaded.
 */
function USc_RDFLoadObserver(){}
  
USc_RDFLoadObserver.prototype =
{
  callback: null,
  callbackDataSource: null,

  Init: function(c,cDS){
    this.callback=c;
    this.callbackDataSource=cDS;
  },

  QueryInterface: function(iid){
    if (iid.equals(Components.interfaces.nsIRDFXMLSinkObserver)) return this;
    else throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  onBeginLoad : function(sink){},
  onInterrupt : function(sink){},
  onResume : function(sink){},
  onError : function(sink,status,msg){},
 
  onEndLoad : function(sink){
    if (this.callback!=null) this.callback(this.callbackDataSource);
  }
};  

function USc_RDFDataSource(uri,callbackFn)
{
  if (uri==null) this.datasource=null;
  else this.load(uri,callbackFn);
}

USc_RDFDataSource.prototype.load=
  function(uri,callbackFn)
{
  if (uri.indexOf(":") == -1){
    var docurl=document.location.href;
    if (document.location.pathname == null) uri=docurl+"/"+uri;
    else uri=docurl.substring(0,docurl.lastIndexOf("/")+1)+uri;
  }

  if (callbackFn == null){
    this.datasource=USc_RDFService.GetDataSourceBlocking(uri);
  }
  else {
    this.datasource=USc_RDFService.GetDataSource(uri);
    var ds;
    try {
      ds=this.datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    }
    catch (ex){
      callbackFn(this);
      return;
    }
    if (ds.loaded){
      callbackFn(this);
      return;
    }

    var packObserver=new USc_RDFLoadObserver();
    packObserver.Init(callbackFn,this);

    var rawsource=this.datasource;
    rawsource=rawsource.QueryInterface(Components.interfaces.nsIRDFXMLSink);
    rawsource.addXMLSinkObserver(packObserver);
  }
}

USc_RDFDataSource.prototype.Init=
  function (dsource)
{
  this.datasource=dsource;
}

USc_RDFDataSource.prototype.parseFromString=
  function (str,baseUri)
{
  if (this.datasource==null) this.makeemptyds();
  var ios=Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
  baseUri=ios.newURI(baseUri,null,null);
  var xmlParser=Components.classes["@mozilla.org/rdf/xml-parser;1"]
                          .createInstance(Components.interfaces.nsIRDFXMLParser);
  xmlParser.parseString(this.datasource,baseUri,str);
}

USc_RDFDataSource.prototype.serializeToString=
  function ()
{
  var outputStream = {
    data: "",
    close : function(){},
    flush : function(){},
    write : function (buffer,count){
      this.data += buffer;
      return count;
    },
    writeFrom : function (stream,count){},
    isNonBlocking: false
  }
  this.serializeToStream(outputStream);
  return outputStream.data;
}

USc_RDFDataSource.prototype.serializeToStream=
  function (outputStream)
{
  var ser=Components.classes["@mozilla.org/rdf/xml-serializer;1"]
                    .createInstance(Components.interfaces.nsIRDFXMLSerializer);
  ser.init(this.datasource);
  ser.QueryInterface(Components.interfaces.nsIRDFXMLSource).Serialize(outputStream);
}

USc_RDFDataSource.prototype.makeemptyds=
  function (uri)
{
  this.datasource=Components.classes["@mozilla.org/rdf/datasource;1?name=in-memory-datasource"]
                            .createInstance(Components.interfaces.nsIUSc_RDFDataSource);
}

USc_RDFDataSource.prototype.getAllResources=
  function ()
{
  if (this.datasource==null) return null;
  return new USc_RDFEnumerator(this.datasource.GetAllResources(),this.datasource);
}

USc_RDFDataSource.prototype.getRawDataSource=
  function ()
{
  if (this.datasource==null) this.makeemptyds();
  return this.datasource;
}

USc_RDFDataSource.prototype.getNode=
  function (uri)
{
  if (this.datasource==null) this.makeemptyds();
  var node=new USc_RDFNode(uri,this);
  return node;
}

USc_RDFDataSource.prototype.getAnonymousNode=
  function ()
{
  if (this.datasource==null) this.makeemptyds();

  var anon=USc_RDFService.GetAnonymousResource();
  var node=new USc_RDFNode();
  node.Init(anon,this.datasource);
  return node;
}

USc_RDFDataSource.prototype.getLiteral=
  function (uri)
{
  if (this.datasource==null) this.makeemptyds();

  return new USc_RDFLiteral(uri,this);
}

USc_RDFDataSource.prototype.refresh=
  function (sync)
{
  try {
    var ds=this.datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    ds.Refresh(sync);
    return true;
  }
  catch (ex){
    return false;
  }
}

USc_RDFDataSource.prototype.save=
  function ()
{
  try {
    var ds=this.datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    ds.Flush();
    return true;
  }
  catch (ex){
    return false;
  }
}

USc_RDFDataSource.prototype.copyAllToDataSource=
  function (dsource2)
{
  if (this.datasource==null) this.makeemptyds();
  if (dsource2.datasource==null) dsource2.makeemptyds();

  var dsource1=this.datasource;
  dsource2=dsource2.datasource;

  var sourcelist=dsource1.GetAllResources();
  while(sourcelist.hasMoreElements()){
    var source=sourcelist.getNext();
    var props=dsource1.ArcLabelsOut(source);
    while(props.hasMoreElements()){
      var prop=props.getNext();
      prop=prop.QueryInterface(Components.interfaces.nsIRDFResource);
      var target=dsource1.GetTarget(source,prop,true);
      if (target!=null) dsource2.Assert(source,prop,target,true);
    }
  }
}

USc_RDFDataSource.prototype.deleteRecursive=
  function (val)
{
  var node;
  var dsource=this.datasource;

  if (dsource==null) return;

  if (typeof val == "string") node=USc_RDFService.GetResource(val);
  else node=val.source;

  this.deleteRecursiveH(dsource,node); // remove descendants

  // remove the node itself
  var props=dsource.ArcLabelsIn(node);
  while(props.hasMoreElements()){
    var prop=props.getNext();
    var source=dsource.GetSource(prop,node,true);
    dsource.Unassert(source,prop,node);
  }
}

USc_RDFDataSource.prototype.deleteRecursiveH=
  function (dsource,node)
{
  var props=dsource.ArcLabelsOut(node);
  while(props.hasMoreElements()){
    var prop=props.getNext();
    var target=dsource.GetTarget(node,prop,true);
    try {
      target=target.QueryInterface(Components.interfaces.nsIRDFResource);
      this.deleteRecursiveH(dsource,target);
    }
    catch (e){}
    dsource.Unassert(node,prop,target)
  }
}

function USc_RDFNode(uri,dsource)
{
  if (uri==null) this.source=null;
  else this.source=USc_RDFService.GetResource(uri);

  if (dsource==null) this.datasource=null;
  else this.datasource=dsource.datasource;

  this.container=null;
}

USc_RDFNode.prototype.Init=
  function (source,dsource)
{
  this.source=source;
  this.datasource=dsource;
  this.container=null;
}

USc_RDFNode.prototype.getValue=
  function ()
{
  return this.source.Value;
}

USc_RDFNode.prototype.rlify=
  function (val)
{
  var res=null;

  if (val!=null){
    try {
      val=val.QueryInterface(Components.interfaces.nsIRDFResource);
      res=new USc_RDFNode();
      res.Init(val,this.datasource);
    }
    catch (ex){
      try {
        val=val.QueryInterface(Components.interfaces.nsIRDFLiteral);
        res=new USc_RDFLiteral();
        res.Init(val,this.datasource);
      }
      catch (ex2){
      }
    }
  }
  return res;
}

USc_RDFNode.prototype.makeres=
  function (val)
{
  if (typeof val == "string") return USc_RDFService.GetResource(val);
  else return val.source;
}

USc_RDFNode.prototype.makelit=
  function (val)
{
  if (typeof val == "string") return USc_RDFService.GetLiteral(val);
  else return val.source;
}

USc_RDFNode.prototype.makecontain=
  function ()
{
  if (this.container!=null) return true;

  var RDFContainer = '@mozilla.org/rdf/container;1';
  RDFContainer = Components.classes[RDFContainer].createInstance();
  RDFContainer = RDFContainer.QueryInterface(Components.interfaces.nsIRDFContainer);

  try {
    RDFContainer.Init(this.datasource,this.source);
    this.container=RDFContainer;
    return true;
  }
  catch (ex){
    return false;
  }
}

USc_RDFNode.prototype.addTarget=
  function (prop,target)
{
  prop=this.makeres(prop);
  target=this.makelit(target);
  this.datasource.Assert(this.source,prop,target,true);
}

USc_RDFNode.prototype.addTargetOnce=
  function (prop,target)
{
  prop=this.makeres(prop);
  target=this.makelit(target);

  var oldtarget=this.datasource.GetTarget(this.source,prop,true);
  if (oldtarget!=null){
    this.datasource.Change(this.source,prop,oldtarget,target);
  }
  else {
    this.datasource.Assert(this.source,prop,target,true);
  }
}

USc_RDFNode.prototype.modifyTarget=
  function (prop,oldtarget,newtarget)
{
  prop=this.makeres(prop);
  oldtarget=this.makelit(oldtarget);
  newtarget=this.makelit(newtarget);
  this.datasource.Change(this.source,prop,oldtarget,newtarget);
}

USc_RDFNode.prototype.modifySource=
  function (prop,oldsource,newsource)
{
  prop=this.makeres(prop);
  oldsource=this.makeres(oldsource);
  newsource=this.makeres(newsource);
  this.datasource.Move(oldsource,newsource,prop,this.source);
}

USc_RDFNode.prototype.targetExists=
  function (prop,target)
{
  prop=this.makeres(prop);
  target=this.makelit(target);
  return this.datasource.HasAssertion(this.source,prop,target,true);
}

USc_RDFNode.prototype.removeTarget=
  function (prop,target)
{
  prop=this.makeres(prop);
  target=this.makelit(target);
  this.datasource.Unassert(this.source,prop,target);
}

USc_RDFNode.prototype.getProperties=
  function ()
{
  return new USc_RDFEnumerator(this.datasource.ArcLabelsOut(this.source),this.datasource);
}

USc_RDFNode.prototype.getInProperties=
  function ()
{
  return new USc_RDFEnumerator(this.datasource.ArcLabelsIn(this.source),this.datasource);
}

USc_RDFNode.prototype.propertyExists=
  function (prop)
{
  prop=this.makeres(prop);
  return this.datasource.hasArcOut(this.source,prop);
}

USc_RDFNode.prototype.inPropertyExists=
  function (prop)
{
  prop=this.makeres(prop);
  return this.datasource.hasArcIn(this.source,prop);
}

USc_RDFNode.prototype.getTarget=
  function (prop)
{
  prop=this.makeres(prop);
  return this.rlify(this.datasource.GetTarget(this.source,prop,true));
}

USc_RDFNode.prototype.getSource=
  function (prop)
{
  prop=this.makeres(prop);
  var src=this.datasource.GetSource(prop,this.source,true);
  if (src==null) return null;
  var res=new USc_RDFNode();
  res.Init(src,this.datasource);
  return res;
}

USc_RDFNode.prototype.getTargets=
  function (prop)
{
  prop=this.makeres(prop);
  return new USc_RDFEnumerator(
    this.datasource.GetTargets(this.source,prop,true),this.datasource);
}

USc_RDFNode.prototype.getSources=
  function (prop)
{
  prop=this.makeres(prop);
  return new USc_RDFEnumerator(
    this.datasource.GetSources(prop,this.source,true),this.datasource);
}

USc_RDFNode.prototype.makeBag=
  function ()
{
  this.container=USc_RDFContainerUtilsService.MakeBag(this.datasource,this.source);
}

USc_RDFNode.prototype.makeSeq=
  function ()
{
  this.container=USc_RDFContainerUtilsService.MakeSeq(this.datasource,this.source);
}

USc_RDFNode.prototype.makeAlt=
  function ()
{
  this.container=USc_RDFContainerUtilsService.MakeAlt(this.datasource,this.source);
}

USc_RDFNode.prototype.isBag=
  function ()
{
  return USc_RDFContainerUtilsService.IsBag(this.datasource,this.source);
}

USc_RDFNode.prototype.isSeq=
  function ()
{
  return USc_RDFContainerUtilsService.IsSeq(this.datasource,this.source);
}

USc_RDFNode.prototype.isAlt=
  function ()
{
  return USc_RDFContainerUtilsService.IsAlt(this.datasource,this.source);
}

USc_RDFNode.prototype.isContainer=
  function ()
{
  return USc_RDFContainerUtilsService.IsContainer(this.datasource,this.source);
}

USc_RDFNode.prototype.getChildCount=
  function ()
{
  if (this.makecontain()){
    return this.container.GetCount();
  }
  return -1;
}

USc_RDFNode.prototype.getChildren=
  function ()
{
  if (this.makecontain()){
    return new USc_RDFEnumerator(this.container.GetElements(),this.datasource);
  }
  else return null;
}

USc_RDFNode.prototype.addChild=
  function (child,exists)
{
  if (this.makecontain()){
    var childres=null;
    if (typeof child == "string"){
      childres=USc_RDFService.GetResource(child);
      child=new USc_RDFNode();
      child.Init(childres,this.datasource);
    }
    else childres=child.source;

    if (!exists && this.container.IndexOf(childres)>=0) return child;

    this.container.AppendElement(childres);
    return child;
  }
  else return null;
}

USc_RDFNode.prototype.addChildAt=
  function (child,idx)
{
  if (this.makecontain()){
    var childres=null;
    if (typeof child == "string"){
      childres=USc_RDFService.GetResource(child);
      child=new USc_RDFNode();
      child.Init(childres,this.datasource);
    }
    else childres=child.source;
    this.container.InsertElementAt(childres,idx,true);
    return child;
  }
  else return null;
}

USc_RDFNode.prototype.removeChild=
  function (child)
{
  if (this.makecontain()){
    var childres=null;
    if (typeof child == "string"){
      childres=USc_RDFService.GetResource(child);
      child=new USc_RDFNode();
      child.Init(childres,this.datasource);
    }
    else childres=child.source;
    this.container.RemoveElement(childres,true);
    return child;
  }
  else return null;
}

USc_RDFNode.prototype.removeChildAt=
  function (idx)
{
  if (this.makecontain()){
    var childres=this.container.RemoveElementAt(idx,true);
    return this.rlify(childres);
  }
  else return null;
}

USc_RDFNode.prototype.getChildIndex=
  function (child)
{
  if (this.makecontain()){
    return this.container.IndexOf(child.source);
  }
  else return -1;
}

USc_RDFNode.prototype.type="Node";


function USc_RDFLiteral(val,dsource)
{
  if (val==null) this.source=null;
  else this.source=USc_RDFService.GetLiteral(val);

  if (dsource==null) this.datasource=null;
  else this.datasource=dsource.datasource;
}

USc_RDFLiteral.prototype.Init=
  function (source,dsource)
{
  this.source=source;
  this.datasource=dsource;
}

USc_RDFLiteral.prototype.getValue=
  function ()
{
  return this.source.Value;
}

USc_RDFLiteral.prototype.makeres=
  function (val)
{
  if (typeof val == "string") return USc_RDFService.GetResource(val);
  else return val.source;
}

USc_RDFLiteral.prototype.makelit=
  function (val)
{
  if (typeof val == "string") return USc_RDFService.GetLiteral(val);
  else return val.source;
}

USc_RDFLiteral.prototype.modifySource=
  function (prop,oldsource,newsource)
{
  prop=this.makeres(prop);
  oldsource=this.makeres(oldsource);
  newsource=this.makeres(newsource);
  this.datasource.Move(oldsource,newsource,prop,this.source);
}

USc_RDFLiteral.prototype.getInProperties=
  function (prop)
{
  return new USc_RDFEnumerator(this.datasource.ArcLabelsIn(this.source),this.datasource);
}

USc_RDFLiteral.prototype.inPropertyExists=
  function (prop)
{
  prop=this.makeres(prop);
  return this.datasource.hasArcIn(this.source,prop);
}

USc_RDFLiteral.prototype.getSource=
  function (prop)
{
  prop=this.makeres(prop);
  var src=this.datasource.GetSource(prop,this.source,true);
  if (src==null) return null;
  var res=new USc_RDFNode();
  res.Init(src,this.datasource);
  return res;
}

USc_RDFLiteral.prototype.getSources=
  function (prop)
{
  prop=this.makeres(prop);
  return new USc_RDFEnumerator(
    this.datasource.GetSources(prop,this.source,true),this.datasource);
}

USc_RDFLiteral.prototype.type="Literal";


function USc_RDFEnumerator(enumeration,dsource)
{
  this.enumeration=enumeration;
  this.datasource=dsource;
}

USc_RDFEnumerator.prototype.hasMoreElements=
  function ()
{
  return this.enumeration.hasMoreElements();
}

USc_RDFEnumerator.prototype.getNext=
  function ()
{
  var res=null;
  var val=this.enumeration.getNext();

  if (val!=null){
    try {
      val=val.QueryInterface(Components.interfaces.nsIRDFResource);
      res=new USc_RDFNode();
      res.Init(val,this.datasource);
    }
    catch (ex){
      try {
        val=val.QueryInterface(Components.interfaces.nsIRDFLiteral);
        res=new USc_RDFLiteral();
        res.Init(val,this.datasource);
      }
      catch (ex2){
      }
    }
  }
  return res;
}

