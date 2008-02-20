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
    var id = this._getUrlParameter("id", "");
    var title = this._getUrlParameter("title", "");
    var newDate = this._getUrlParameter("newDate", "");
    var oldDate = this._getUrlParameter("oldDate", "");
    var url = this._getUrlParameter("url", "");
    var view = this._getUrlParameter("view", "diff");

    this.baseUrl = "chrome://updatescan/content/diffPage.xul?id="+escape(id) +
    "&title=" + escape(title) +
    "&newDate=" + escape(newDate) +
    "&oldDate=" + escape(oldDate) +
    "&url=" + escape(url) +
    "&view=";

    var content;

    var filebase=USc_file.escapeFilename(id);
    var oldContent  = USc_file.USreadFile(filebase+".old");
    var newContent  = USc_file.USreadFile(filebase+".new");
    oldContent = this._stripScript(oldContent);
    newContent = this._stripScript(newContent);

    if (newContent=="**NEW**") {
	view="notChecked";
    }

    document.getElementById("linkCurrent").href=url;

    if (!this.loaded) {
        this.loaded = true;

	switch (view) {
	case "diff" :
	    document.getElementById("sectionDiff").hidden=false;
	    document.getElementById("titleDiff").value=title;
	    document.getElementById("dateDiff").value=newDate;
	    document.getElementById("linkDiff").className="header";
	    content = USc_diffWiki.WDiffString(oldContent, newContent);
	    break;
	case "new":
	    document.getElementById("sectionNew").hidden=false;
	    document.getElementById("titleNew").value=title;
	    document.getElementById("dateNew").value=newDate;
	    document.getElementById("linkNew").className="header";
	    content = newContent;
	    break;
	case "old":
	    document.getElementById("sectionOld").hidden=false;
	    document.getElementById("titleOld").value=title;
	    document.getElementById("dateOld").value=oldDate;
	    document.getElementById("linkOld").className="header";
	    content = oldContent;
	    break;
	default:
	    document.getElementById("sectionNotChecked").hidden=false;
	    document.getElementById("sectionView").hidden=true;
	    document.getElementById("titleNotChecked").value=title;
	    content = "";
	}

	var doc = frames[0].document;
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
