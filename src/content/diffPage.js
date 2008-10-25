/* ***** BEGIN LICENSE BLOCK *****
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is Update Scanner.
 * 
 * The Initial Developer of the Original Code is Pete Burgers.
 * Portions created by Pete Burgers are Copyright (C) 2006-2007
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.  
 * ***** END LICENSE BLOCK ***** */
 
if (typeof(USc_diffPage_exists) != 'boolean') {
var USc_diffPage_exists = true;
var USc_diffPage = {    

load : function()
{
    if (!this.loaded) {
        this.loaded = true;
    
        var id = this._getUrlParameter("id", "");
        var title = this._getUrlParameter("title", "");
        var newDate = this._getUrlParameter("newDate", "");
        var oldDate = this._getUrlParameter("oldDate", "");
        var url = this._getUrlParameter("url", "");
        var view = this._getUrlParameter("view", "diff");

        document.title = title;

        this.baseUrl = "chrome://updatescan/content/diffPage.xul?id="+escape(id) +
        "&title=" + escape(title) +
        "&newDate=" + escape(newDate) +
        "&oldDate=" + escape(oldDate) +
        "&url=" + escape(url) +
        "&view=";

        var content;

        var filebase = USc_places.getSignature(id);
        var oldContent  = USc_file.USreadFile(filebase+".old");
        var newContent  = USc_file.USreadFile(filebase+".new");
        oldContent = this._stripScript(oldContent);
        newContent = this._stripScript(newContent);

    	if (newContent=="") {
	    view="notChecked";
        }

	switch (view) {
	case "diff" :
	    document.getElementById("sectionDiff").hidden=false;
	    document.getElementById("titleDiff").value=title;
	    document.getElementById("dateDiff").value=newDate;
	    content = USc_diffWiki.WDiffString(oldContent, newContent);
	    break;
	case "new":
	    document.getElementById("sectionNew").hidden=false;
	    document.getElementById("titleNew").value=title;
	    document.getElementById("dateNew").value=newDate;
	    content = newContent;
	    break;
	case "old":
	    document.getElementById("sectionOld").hidden=false;
	    document.getElementById("titleOld").value=title;
	    document.getElementById("dateOld").value=oldDate;
	    content = oldContent;
	    break;
	default:
	    document.getElementById("sectionNotChecked").hidden=false;
	    document.getElementById("sectionView").hidden=true;
	    document.getElementById("titleNotChecked").value=title;
	    content = "";
	}
        this._writeViewFrame(view, url);
	var doc = document.getElementById("diffFrame").contentDocument;
	doc.open();
	doc.write("<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>\n");
	doc.write("<base href='"+url+"' target='_parent'>\n");	    
	doc.write(content);
	doc.close();
    }
},

click : function(view) 
{
    location.href = this.baseUrl+view;
},

_writeViewFrame : function (view, url)
{
    var str=document.getElementById("diffPageStrings")
    
    var viewFrame = document.getElementById("sectionView");
    var viewDoc = viewFrame.contentDocument;

    var oldPage=str.getString("oldPage");
    var newPage=str.getString("newPage");
    var changes=str.getString("changes");
    var currentPage=str.getString("currentPage");

    viewDoc.open();
    viewDoc.write("<html><head>");
    viewDoc.write("<link rel='stylesheet' href='chrome://updatescan/skin/diffPage.css' type='text/css'/>");
    viewDoc.write("</head><body>");
    viewDoc.write("<b>View:</b>&nbsp;\n");
    if (view == "old") 
        viewDoc.write("<b>"+oldPage+"</b>&nbsp;\n");
    else
        viewDoc.write("<a href='"+this.baseUrl+"old' target='_top'>"+oldPage+"</a>&nbsp;\n");
    if (view == "new") 
        viewDoc.write("<b>"+newPage+"</b>&nbsp;\n");
    else
        viewDoc.write("<a href='"+this.baseUrl+"new' target='_top'>"+newPage+"</a>&nbsp;\n");
    if (view == "diff") 
        viewDoc.write("<b>"+changes+"</b>&nbsp;\n");
    else
        viewDoc.write("<a href='"+this.baseUrl+"diff' target='_top'>"+changes+"</a>\n&nbsp;");
    viewDoc.write("<a href='"+url+"' target='_top'>"+currentPage+"</a>\n");
    viewDoc.write("</body></html>");
    viewDoc.close();
},

// Taken with permission from http://www.netlobo.com/url_query_string_javascript.html
_getUrlParameter : function (name, def)
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return def;
  else
      return unescape(results[1]);
},

_stripScript : function(content)
{
    content = content.replace(/<script([\r\n]|.)*?>([\r\n]|.)*?<\/script>/gi,"");
    return    content;
}

}
}
