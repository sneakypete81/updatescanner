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

var ksliderThresholdValues = 5;
var ksliderThresholdMax = 100;
var ksliderAutoscanValues = 6;
var ksliderAutoscanMax = 100;

function initDialog()
{
    var args = window.arguments[0];
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.");
    
    document.title = "Update Scanner";
    document.getElementById("txtTitle").value = args.title;
    document.getElementById("txtURL").value = args.url;

    document.getElementById("sliderThreshold")
            .setAttribute("maxpos", ksliderThresholdMax);
    sliderThresholdSetPos(sliderThresholdEncode(args.threshold));
    sliderThresholdChange();

    document.getElementById("textThreshold").value = args.threshold;

    if (args.scanRateMins < 5) {
	args.scanRateMins = 5;
    }

    document.getElementById("sliderAutoscan")
            .setAttribute("maxpos", ksliderAutoscanMax);
    sliderAutoscanSetPos(sliderAutoscanEncode(args.scanRateMins));
    sliderAutoscanChange();

    if (args.scanRateMins % (60*24) == 0) {
	document.getElementById("textAutoscan").value = args.scanRateMins/(60*24);
	document.getElementById("menuAutoscanUnit").value = "Days";
    } else if (args.scanRateMins % 60 == 0) {
	document.getElementById("textAutoscan").value = args.scanRateMins/60;
	document.getElementById("menuAutoscanUnit").value = "Hours";
    } else {
	document.getElementById("textAutoscan").value = args.scanRateMins;
	document.getElementById("menuAutoscanUnit").value = "Minutes";
    }

    if (args.ignoreNumbers == "true") {
        document.getElementById("ignoreNumbers").checked = true;
    } else {
        document.getElementById("ignoreNumbers").checked = false;
    }

    loadAvailableCharSets();
    charEncodingChanged()
    
    if (args.encoding == "auto") {
        document.getElementById("autoCharEncoding")
                .selectedIndex = 0;
    } else {
        try {
            document.getElementById("encodingMenu").selectedItem = 
                           document.getElementById(args.encoding.toLowerCase())
        } catch (e) {} 
        document.getElementById("autoCharEncoding")
                .selectedIndex = 1;
    }

    var advSection = document.getElementById("advSection");
    var advLabel = document.getElementById("advLabel");
    
    if (args.advanced) {
        advSection.hidden = false;
        advLabel.hidden = true;
    }

    var useSliders = prefBranch.getBoolPref("scan.useSliders");
    document.getElementById("groupboxAutoscanSlider").hidden = !useSliders;
    document.getElementById("groupboxThresholdSlider").hidden = !useSliders;
    document.getElementById("groupboxAutoscanNumbers").hidden = useSliders;
    document.getElementById("groupboxThresholdNumbers").hidden = useSliders;

}

function Ok()
{
    var args = window.arguments[0];
    var scanrate;
    var txtURL=document.getElementById("txtURL");
    var txtTitle=document.getElementById("txtTitle");
    var noDataAlert=document.getElementById("strings").getString(
                                            "noDataAlert");
    var fiveMinuteAlert=document.getElementById("strings").getString(
                        "shortScanAlert");
    var httpexists = /^[A-Za-z]+:\/\//;
    var restexists = /^[A-Za-z]+:\/\/\W*\w/;
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService();
    prefService = prefService.QueryInterface(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("extensions.updatescan.");

    if (!httpexists.test(txtURL.value.toLowerCase())) {
        txtURL.value="http://" + txtURL.value;
    }
    if (txtTitle.value == "" || !restexists(txtURL.value))
    {
        alert(noDataAlert);
        return false;
    }
    
    args.title = txtTitle.value;
    args.url = txtURL.value;
    if (prefBranch.getBoolPref("scan.useSliders")) {
	args.threshold = sliderThresholdDecode(sliderThresholdGetPos());
	args.scanRateMins = sliderAutoscanDecode(sliderAutoscanGetPos());
    } else {
	args.threshold = document.getElementById("textThreshold").value;
	args.scanRateMins = document.getElementById("textAutoscan").value;
	if (document.getElementById("menuAutoscanUnit").value == "Hours") {
	    args.scanRateMins = args.scanRateMins * 60;
	} else 	if (document.getElementById("menuAutoscanUnit").value == "Days") {
	    args.scanRateMins = args.scanRateMins * 60 * 24;
	}
	if (args.scanRateMins < 5) {
	    args.scanRateMins = 5;
	}
    }

    if (prefBranch.getBoolPref("scan.warnScanShort") &&
        args.scanRateMins < 15) {
        if (!confirm(fiveMinuteAlert)) {
            return false;
        }
    }

    if (document.getElementById("ignoreNumbers").checked) {
        args.ignoreNumbers = "true";
    } else {
        args.ignoreNumbers = "false";
    }
    if (document.getElementById("autoCharEncoding").selectedIndex == 0) {
        args.encoding = "auto";
    } else {
        args.encoding = document.getElementById("encodingMenu").selectedItem.id;
    }

    args.ok = true;

    return true;
}

function Cancel()
{
    window.arguments[0].ok = false;
    return true;
}

function Help()
{
    var addPageTip=document.getElementById("strings").getString("addPageTip");
    alert(addPageTip);
    return true;
}

function advancedClick()
{
    var advLabel = document.getElementById("advLabel");
    var advSection = document.getElementById("advSection");
    
    advLabel.hidden = true;
    advSection.hidden = false;
    
    window.sizeToContent();
}

function sliderThresholdGetPos()
{
    var slider=document.getElementById("sliderThreshold");
    return Math.round(slider.getAttribute("curpos") /
              ksliderThresholdMax*ksliderThresholdValues);
}

function sliderThresholdSetPos(value)
{
    var slider=document.getElementById("sliderThreshold");
    slider.setAttribute("curpos",value*ksliderThresholdMax /
            ksliderThresholdValues);
}

function sliderThresholdChange() 
{
    var strings=document.getElementById("strings");
    var slider=document.getElementById("sliderThreshold");
    var label1=document.getElementById("label1");
    var label2=document.getElementById("label2");
    var pos = sliderThresholdGetPos();
    if (pos == 0) {
        label1.value=strings.getString("thresholdLabel0a");
        label2.value=""
    } else if (pos == 1) {
        label1.value=strings.getString("thresholdLabel1a");
        label2.value=strings.getString("thresholdLabel1b");
    } else if (pos == 2) {
        label1.value=strings.getString("thresholdLabel2a");
        label2.value=strings.getString("thresholdLabel2b");
    } else if (pos == 3) {
        label1.value=strings.getString("thresholdLabel3a");
        label2.value=strings.getString("thresholdLabel3b");
    } else if (pos == 4) {
        label1.value=strings.getString("thresholdLabel4a");
        label2.value=strings.getString("thresholdLabel4b");
    } else if (pos == 5) {
        label1.value=strings.getString("thresholdLabel5a");
        label2.value=strings.getString("thresholdLabel5b");
    }
}

function sliderThresholdEncode(threshold)
{
    if (threshold < 5)
        return 0;
    if (threshold < 30)
        return 1;
    if (threshold < 75)
        return 2;
    if (threshold < 300)
        return 3;
    if (threshold < 750)
        return 4;
    return 5;
}

function sliderThresholdDecode(slider)
{
    if (slider == 0)
        return 0;
    if (slider == 1)
        return 10;
    if (slider == 2)
        return 50;
    if (slider == 3)
        return 100;
    if (slider == 4)
        return 500;
    return 1000;
}

function sliderAutoscanGetPos()
{
    var slider=document.getElementById("sliderAutoscan");
    return Math.round(slider.getAttribute("curpos") /
              ksliderAutoscanMax*ksliderAutoscanValues);
}

function sliderAutoscanSetPos(value)
{
    var slider=document.getElementById("sliderAutoscan");
    slider.setAttribute("curpos",value*ksliderAutoscanMax /
            ksliderAutoscanValues);
}

function sliderAutoscanChange() 
{
    var strings=document.getElementById("strings");
    var slider=document.getElementById("sliderAutoscan");
    var label3=document.getElementById("label3");
    var pos = sliderAutoscanGetPos();
    if (pos == 0) {
        label3.value=strings.getString("autoscanLabel0a");
    } else if (pos == 1) {
        label3.value=strings.getString("autoscanLabel1a");
    } else if (pos == 2) {
        label3.value=strings.getString("autoscanLabel2a");
    } else if (pos == 3) {
        label3.value=strings.getString("autoscanLabel3a");
    } else if (pos == 4) {
        label3.value=strings.getString("autoscanLabel4a");
    } else if (pos == 5) {
        label3.value=strings.getString("autoscanLabel5a");
    } else if (pos == 6) {
        label3.value=strings.getString("autoscanLabel6a");
    }
}

function sliderAutoscanEncode(scanratemins)
{
    if (scanratemins == 0)      // Manual
        return 6;
    if (scanratemins < 10)
        return 0;
    if (scanratemins < 20)
        return 1;
    if (scanratemins < 45)
        return 2;
    if (scanratemins < 60 * 3)
        return 3;
    if (scanratemins < 60 * 12)
        return 4;
    else
        return 5;
}

function sliderAutoscanDecode(slider)
{
    if (slider == 0)
        return 5;        // 5 minutes
    if (slider == 1)
        return 15;       // 15 minutes
    if (slider == 2)
        return 30;       // 30 minutes
    if (slider == 3)
        return 60;       // Hourly
    if (slider == 4)
        return 60 * 6;   // 6 Hours
    if (slider == 5)
        return 60 * 24;  // Daily
    else
        return 0;        // Manual
}

function charEncodingChanged()
{
    var auto=document.getElementById("autoCharEncoding");
    var encodingMenu = document.getElementById("encodingMenu");
    if  (auto.selectedIndex == 1) {
        encodingMenu.disabled = false;
    } else {
        encodingMenu.disabled = true;
    }
}

function readRDFString(aDS,aRes,aProp) 
{
  var n = aDS.GetTarget(aRes, aProp, true);
  if (n)
    return n.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
  else 
    return "";
}

function loadAvailableCharSets()
// From Firefox source:
{
    var availCharsetDict     = [];
    var encodingPopup = document.getElementById('encodingPopup');
    var rdf=Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService); 
    var kNC_Root = rdf.GetResource("NC:DecodersRoot");
    var kNC_name = rdf.GetResource("http://home.netscape.com/NC-rdf#Name");
    var rdfDataSource = rdf.GetDataSource("rdf:charset-menu"); 
    var rdfContainer = Components.classes["@mozilla.org/rdf/container;1"].getService(Components.interfaces.nsIRDFContainer);

    // Need the following to populate the RDF source?
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "charsetmenu-selected", "other");

    rdfContainer.Init(rdfDataSource, kNC_Root);
    var availableCharsets = rdfContainer.GetElements();
    var charset;

    for (var i = 0; i < rdfContainer.GetCount(); i++) {
      charset = availableCharsets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      availCharsetDict[i] = new Array(2);
      availCharsetDict[i][0] = readRDFString(rdfDataSource, charset, kNC_name);
      availCharsetDict[i][1] = charset.Value;
      AddMenuItem(document,
                  encodingPopup,
                  availCharsetDict[i][1],
                  availCharsetDict[i][0]);
    }
}

function AddMenuItem(doc, menu, ID, UIstring)
{
    try {
        // Create a treerow for the new item
        var item = doc.createElement('menuitem');

        // Copy over the attributes
        item.setAttribute('label', UIstring);
        item.setAttribute('id', ID.toLowerCase());

        menu.appendChild(item);
    } catch(e) {}
}
