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
        this.id = id
        var title = this._getUrlParameter("title", "");
        var newDate = this._getUrlParameter("newDate", "");
        var oldDate = this._getUrlParameter("oldDate", "");
        var url = this._getUrlParameter("url", "");
        var view = this._getUrlParameter("view", "diff");

        document.title = title;
        document.getElementById("title").value=title;

        this.baseUrl = "chrome://updatescan/content/diffPage.xul?id="+escape(id) +
        "&title=" + escape(title) +
        "&newDate=" + escape(newDate) +
        "&oldDate=" + escape(oldDate) +
        "&url=" + escape(url) +
        "&view=";

        var content=""
        var newContent=""
        var oldContent=""
        var enableDiffLinks = true;

        var filebase = USc_places.queryAnno(id, USc_places.ANNO_SIGNATURE, "");
        if (filebase != "") {
            oldContent  = USc_file.USreadFile(filebase+".old");
            newContent  = USc_file.USreadFile(filebase+".new");
        }
    	if (newContent=="") {
	    view="notChecked";
            enableDiffLinks = false;
        }
        if (USc_places.queryAnno(id, USc_places.ANNO_STATUS, "")
            == USc_places.STATUS_ERROR)
        {
            view="error";
            enableDiffLinks = false;
        }

	switch (view) {
	case "diff" :
	    document.getElementById("sectionDiff").hidden=false;
	    document.getElementById("dateDiff").value=newDate;
//            this._launchThread(url, oldContent, newContent);
	    content = USc_diffWiki.WDiffString(oldContent, newContent);
            break;
	case "new":
	    document.getElementById("sectionNew").hidden=false;
	    document.getElementById("dateNew").value=newDate;
	    content = newContent;
	    break;
	case "old":
	    document.getElementById("sectionOld").hidden=false;
	    document.getElementById("dateOld").value=oldDate;
	    content = oldContent;
	    break;
        case "error":
	    document.getElementById("sectionError").hidden=false;
            break;
	default:
	    document.getElementById("sectionNotChecked").hidden=false;
	}

        this._writeViewFrame(view, url, enableDiffLinks);
        this._writeContentFrame(url, content);
        
    }
},

click : function(view) 
{
    location.href = this.baseUrl+view;
},

editProperties : function()
{
    USc_updatescan.openEditDialog(this.id);
},

_writeViewFrame : function (view, url, enableDiffLinks)
{
    var str=document.getElementById("diffPageStrings")
    
    var viewFrame = document.getElementById("sectionView");
    var viewDoc = viewFrame.contentDocument;

    var viewStr=str.getString("view");
    var oldPage=str.getString("oldPage");
    var newPage=str.getString("newPage");
    var changes=str.getString("changes");
    var currentPage=str.getString("currentPage");

    viewDoc.open();
    viewDoc.write("<html><head>");
    viewDoc.write("<link rel='stylesheet' href='chrome://updatescan/skin/diffPage.css' type='text/css'/>");
    viewDoc.write("</head><body>");
    viewDoc.write("<b>"+viewStr+":</b>&nbsp;\n");

    if (view == "old") 
        viewDoc.write("<b>"+oldPage+"</b>&nbsp;\n");
    else if (enableDiffLinks)
        viewDoc.write("<a href='"+this.baseUrl+"old' target='_top'>"+oldPage+"</a>&nbsp;\n");
    else
        viewDoc.write("<span style='color:#808080'>"+oldPage+"</span>&nbsp;\n");

    if (view == "new") 
        viewDoc.write("<b>"+newPage+"</b>&nbsp;\n");
    else if (enableDiffLinks)
        viewDoc.write("<a href='"+this.baseUrl+"new' target='_top'>"+newPage+"</a>&nbsp;\n");
    else
        viewDoc.write("<span style='color:#808080'>"+newPage+"</span>&nbsp;\n");

    if (view == "diff") 
        viewDoc.write("<b>"+changes+"</b>&nbsp;\n");
    else if (enableDiffLinks)
        viewDoc.write("<a href='"+this.baseUrl+"diff' target='_top'>"+changes+"</a>\n&nbsp;");
    else
        viewDoc.write("<span style='color:#808080'>"+changes+"</span>\n&nbsp;");
    

    viewDoc.write("<a href='"+url+"' target='_top'>"+currentPage+"</a>\n");
    viewDoc.write("</body></html>");
    viewDoc.close();
},

_writeContentFrame : function (url, content)
{
    // Charset is always UTF-8, since we read it from file
    // Set baseURI manually
    var re = /<\s*head[^>]*>/i;
    var header = ("<meta http-equiv='Content-Type' content='text/html;"+
                  "charset=UTF-8'>\n" +
                  "<base href='"+url+"' target='_parent'>\n");
    // Insert header into <head> element if one exists,
    // otherwise just tack on the start
    if (re.test(content))
        content = content.replace(re, "<head>"+header);
    else
        content = header + content;

    var frame = document.getElementById("diffFrame");

    frame.docShell.allowAuth = false;  
    frame.docShell.allowMetaRedirects = false;   
    frame.docShell.allowJavascript = true;  
    frame.docShell.allowPlugins = true;  

    frame.setAttribute("src", "data:text/html," + 
                       encodeURIComponent(content));  
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

_launchThread : function(url, oldContent, newContent)
// Run the diff script from another thread, so as not to slow things down too much
// See https://developer.mozilla.org/en/The_Thread_Manager for more details
{

    var workingThread = function(threadID, url, oldContent, newContent) {
      this.threadID = threadID;
      this.url = url;
      this.oldContent = oldContent;
      this.newContent = newContent;
      this.result = "";
    }    
    workingThread.prototype = {
      run: function() {
        try {
          // This is where the working thread does its processing work.
          this.result = USc_diffWiki.WDiffString(this.oldContent, this.newContent);
          
          // When it's done, call back to the main thread to let it know
          // we're finished.
         
          main.dispatch(new mainThread(this.threadID, this.url, this.result),
            background.DISPATCH_NORMAL);
        } catch(err) {
          Components.utils.reportError(err);
        }
      },      
      QueryInterface: function(iid) {
        if (iid.equals(Components.interfaces.nsIRunnable) ||
            iid.equals(Components.interfaces.nsISupports)) {
                return this;
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
      }
    };
    
    var mainThread = function(threadID, url, result) {
      this.threadID = threadID;
      this.url = url;
      this.result = result;
    };
    mainThread.prototype = {
      run: function() {
        try {
          // This is where we react to the completion of the working thread.
          USc_diffPage._writeContentFrame(this.url, this.result);
//          myDump('Thread ' + this.threadID + ' finished ('+this.url+')\n');
        } catch(err) {
          Components.utils.reportError(err);
        }
      },
      QueryInterface: function(iid) {
        if (iid.equals(Components.interfaces.nsIRunnable) ||
            iid.equals(Components.interfaces.nsISupports)) {
                return this;
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
      }
    };

    var background = Components.classes["@mozilla.org/thread-manager;1"].getService().newThread(0);
    var main = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
    background.dispatch(new workingThread(1, url, oldContent, newContent),
                        background.DISPATCH_NORMAL);
    
}

}
}
