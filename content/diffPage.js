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

UpdateScanner.DiffPage = {

load : function()
{
    if (!this.loaded) {
        this.loaded = true;
        var delay = this._getUrlParameter("delay", "0");
        this.timer = (Components.classes["@mozilla.org/timer;1"]
                      .createInstance(Components.interfaces.nsITimer));
        this.timer.initWithCallback(UpdateScanner.DiffPageTimer,
                                    delay * 1000,
                                    Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    }
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

editProperties : function()
{
    var id = UpdateScanner.DiffPage._getUrlParameter("id", "");
    UpdateScanner.Updatescan.openEditDialog(id);
},

delete : function()
{
    var str = document.getElementById("diffPageStrings");
    var id = UpdateScanner.DiffPage._getUrlParameter("id", "");

    if (confirm(str.getString("confirmDelete"))) {
        UpdateScanner.Places.deleteBookmark(id);
        window.location.href = "about:blank";
    }
},

};

UpdateScanner.DiffPageTimer = {

notify : function(timer)
{
    var id = UpdateScanner.DiffPage._getUrlParameter("id", "");
    var title = UpdateScanner.DiffPage._getUrlParameter("title", "");
    var newDate = UpdateScanner.DiffPage._getUrlParameter("newDate", "");
    var oldDate = UpdateScanner.DiffPage._getUrlParameter("oldDate", "");
    var url = UpdateScanner.DiffPage._getUrlParameter("url", "");
    var view = UpdateScanner.DiffPage._getUrlParameter("view", "diff");

    document.title = title;
    document.getElementById("title").value=title;

    this.baseUrl = ("about:updatescan?id="+escape(id) +
                    "&title=" + escape(title) +
                    "&newDate=" + escape(newDate) +
                    "&oldDate=" + escape(oldDate) +
                    "&url=" + escape(url) +
                    "&view=");

    var thisContent="";
    var newContent="";
    var oldContent="";
    var enableDiffLinks = true;

    var filebase = UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_SIGNATURE, "");
    if (filebase != "") {
        oldContent  = UpdateScanner.File.USreadFile(filebase+".old");
        newContent  = UpdateScanner.File.USreadFile(filebase+".new");
    }
    if (newContent=="") {
        view="notChecked";
        enableDiffLinks = false;
    }
    if (UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_STATUS, "")
        == UpdateScanner.Places.STATUS_ERROR)
    {
        view="error";
        enableDiffLinks = false;
    }

    switch (view) {
    case "diff" :
        var highlightColour = UpdateScanner.Places.queryAnno(id, UpdateScanner.Places.ANNO_HIGHLIGHT_COLOUR,
                                                             UpdateScanner.Defaults.DEF_HIGHLIGHT_COLOUR);
        // Set heading label highlight background
        document.getElementById("highlightedLabel").
            setAttribute('style', 'font-weight:bold;background: ' + highlightColour);
        document.getElementById("sectionDiff").hidden=false;
        document.getElementById("dateDiff").value=newDate;
        thisContent = UpdateScanner.DiffWiki.WDiffString(oldContent, newContent, highlightColour);
        break;
    case "new":
        document.getElementById("sectionNew").hidden=false;
        document.getElementById("dateNew").value=newDate;
        thisContent = newContent;
        break;
    case "old":
        document.getElementById("sectionOld").hidden=false;
        document.getElementById("dateOld").value=oldDate;
        thisContent = oldContent;
        break;
    case "error":
        document.getElementById("sectionError").hidden=false;
        break;
    default:
        document.getElementById("sectionNotChecked").hidden=false;
    }

    this._writeViewFrame(view, url, enableDiffLinks);

    this._writeContentFrame(url, thisContent);
},

click : function(view)
{
    location.href = this.baseUrl+view;
},

_writeViewFrame : function (view, url, enableDiffLinks)
{
    var str=document.getElementById("diffPageStrings");

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

_writeContentFrame : function (url, thisContent)
{
    // Charset is always UTF-8, since we read it from file
    // Set baseURI manually
    var re = /<\s*head[^>]*>/i;
    var header = ("<meta http-equiv='Content-Type' content='text/html;"+
                  "charset=UTF-8'>\n" +
                  "<base href='"+url+"' target='_parent'>\n");
    // Insert header into <head> element if one exists,
    // otherwise just tack on the start
    if (re.test(thisContent))
        thisContent = thisContent.replace(re, "<head>"+header);
    else
        thisContent = header + thisContent;

    const XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var frame = document.createElementNS(XUL, "iframe");
    frame.setAttribute("flex", 1);
    frame.setAttribute("type", "content");

    var win = document.getElementById("diffPage");
    win.appendChild(frame);

    messageHandler = "<script type='text/javascript'>" +
                     "   document.addEventListener('US_event'," +
                     "      function(e) {" +
                     "         document.write(e.target.getAttribute('content')); },false);" +
                     "</script>";

    frame.contentDocument.open();
    frame.contentDocument.write(messageHandler);
    frame.contentDocument.close();

    var element = frame.contentDocument.createElement("US_data");
    element.setAttribute("content", thisContent);
    frame.contentDocument.documentElement.appendChild(element);

    var event = frame.contentDocument.createEvent("HTMLEvents");
    event.initEvent("US_event", true, false);
    element.dispatchEvent(event);
},
};
