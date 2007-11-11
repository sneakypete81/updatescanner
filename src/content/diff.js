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

if (typeof(USc_diff_exists) != 'boolean') {
var USc_diff_exists = true;
var USc_diff = {    

kDiffView : 0,
kNewView : 1,
kOldView : 2,
kUnscannedView : 3,

create : function(oldContent, newContent)
{
    var me = USc_diff;
    oldContent = me._stripScript(oldContent);
    newContent = me._stripScript(newContent);
    return USc_diffWiki.WDiffString(oldContent, newContent);
},

display : function(title, sourceURL, oldContent, newContent, diffContent,
                      oldDate, newDate, numItems)
{
    var me = USc_diff;
    var data; 
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler);

    if (numItems < 10) numItems = 10; // 10 temp files minimum

    if (newContent == "**NEW**") {
        var diffFile = USc_file.openTempFile("UpdatescanDiff","htm");
        USc_file.incrementTempFile(numItems);
        var diffURL = fileHandler.getURLSpecFromFile(diffFile);
    
        data = me._generateHeader(me.kUnscannedView, title, "", 
                              sourceURL, "", "", "");    
        USc_io.write(diffFile, data, "", "UTF-8");
    
        return diffURL;
    }
    
    oldContent = me._stripScript(oldContent);
    newContent = me._stripScript(newContent)

    var newFile  = USc_file.openTempFile("UpdatescanNew","htm");
    var oldFile  = USc_file.openTempFile("UpdatescanOld","htm"); 
    var diffFile = USc_file.openTempFile("UpdatescanDiff","htm");
    USc_file.incrementTempFile(numItems);
    var newURL  = fileHandler.getURLSpecFromFile(newFile);
    var oldURL  = fileHandler.getURLSpecFromFile(oldFile);
    var diffURL = fileHandler.getURLSpecFromFile(diffFile);

    data = me._generateHeader(me.kOldView, title, oldDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += oldContent;
    USc_io.write(oldFile, data, "", "UTF-8");

    data = me._generateHeader(me.kNewView, title, newDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += newContent;
    USc_io.write(newFile, data, "", "UTF-8");

    data = me._generateHeader(me.kDiffView, title, newDate, 
                          sourceURL, diffURL, oldURL, newURL);    
    data += diffContent;
    USc_io.write(diffFile, data, "", "UTF-8");

    return diffURL;
},

_generateHeader : function(currentView, title, date, sourceURL, diffURL, oldURL, newURL)
{
    var me = USc_diff;
    var data;
    var str = document.getElementById("updatescanStrings");
    var param;
    data = "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>"
    data += "<base href='"+sourceURL+"'>\n";
    data += "<table bgcolor=#e5e5ff color=#ffffff cellpadding=5 width=100%>\n";
    data += "<td><img src='chrome://updatescan/skin/updatescan_big.png'></td>\n";
    data += "<td>\n";
    data += "<span style='font: 12px verdana;color:black'>\n";

    switch (currentView) {
    case me.kDiffView:
        param = {title:title, timeDiff:date, 
                 highlightOn:"<b style='color:black;background-color:#ffff66'>",
                 highlightOff:"</b>"};
        data += str.getString("headerDiff").supplant(param);
        break;
    case me.kOldView:
        param = {title:title, timeDiff:date};
        data += str.getString("headerOld").supplant(param);
        break;
    case me.kNewView:
        param = {title:title, timeDiff:date};
        data += str.getString("headerNew").supplant(param);
        break;
    default:
        param = {title:title};
        data += str.getString("headerNotChecked").supplant(param);
    }
    
    data += "<br><b>"+str.getString("view")+":</b> [\n";
    if (currentView != me.kUnscannedView) {
        if (currentView == me.kOldView) {
            data += "<b>"+str.getString("oldPage")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+oldURL+"'>";
            data += str.getString("oldPage")+"</a> |\n";
        }
        if (currentView == me.kNewView) {
            data += "<b>"+str.getString("newPage")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+newURL+"'>";
            data += str.getString("newPage")+"</a> |\n";
        }
        if (currentView == me.kDiffView) {
            data += "<b>"+str.getString("changes")+"</b> |\n";
        } else {
            data += "<a style='color:blue;font-weight:normal' ";
            data += "href='"+diffURL+"'>";
            data += str.getString("changes")+"</a> |\n";
        }
    }
    data += "<a style='color:blue;font-weight:normal' href='"+sourceURL+"'>"+sourceURL+"</a> ]\n"
    data += "</span></td></table>\n";
    data += "<hr>\n";
    data += "<div style='position:relative'>\n";
    return data;
},

_stripScript : function(content)
{
    content = content.replace(/<script([\r\n]|.)*?>([\r\n]|.)*?<\/script>/gi,"");
    return    content;
}

}
}