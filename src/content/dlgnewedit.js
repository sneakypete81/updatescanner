const sliderThresholdValues = 5;
const sliderThresholdMax = 100;
const sliderAutoscanValues = 6;
const sliderAutoscanMax = 100;

function initDialog()
{
    var args = window.arguments[0];
    
    if (args.winTitle != "") {
        document.title = args.winTitle;
    } else {
        document.title = "Update Scanner";
    }
    document.getElementById("txtTitle").value = args.title;
    document.getElementById("txtURL").value = args.url;

    document.getElementById("sliderThreshold")
            .setAttribute("maxpos", sliderThresholdMax);
    sliderThresholdSetPos(sliderThresholdEncode(args.threshold));
    sliderThresholdChange();

    document.getElementById("sliderAutoscan")
            .setAttribute("maxpos", sliderAutoscanMax);
    sliderAutoscanSetPos(sliderAutoscanEncode(args.scanRateMins));
    sliderAutoscanChange();

    if (args.ignoreNumbers == "True") {
        document.getElementById("ignoreNumbers").checked = true;
    } else {
        document.getElementById("ignoreNumbers").checked = false;
    }

    loadAvailableCharSets();
    charEncodingChanged()
    
    if (args.encodingDetect != "Manual") {
        document.getElementById("autoCharEncoding")
                .selectedIndex = 0;
    } else {
        document.getElementById("autoCharEncoding")
                .selectedIndex = 1;
    }

    var encoding = document.getElementById(args.encoding)
    if (encoding == null) {
        encoding = document.getElementById("UTF-8");
    }
    document.getElementById("encodingMenu").selectedItem = encoding; 

    var advSection = document.getElementById("advSection");
    var advLabel = document.getElementById("advLabel");
    
    if (args.advanced) {
        advSection.hidden = false;
        advLabel.hidden = true;
    }
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
                        "fiveMinuteAlert");
    var httpexists = /^[A-Za-z]+:\/\//;
    var restexists = /^[A-Za-z]+:\/\/\W*\w/;

    if (sliderAutoscanDecode(sliderAutoscanGetPos()) == 5)
    if (!confirm(fiveMinuteAlert)) {
        return false;
    }
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
    args.threshold = String(sliderThresholdDecode(sliderThresholdGetPos()));
    args.scanRateMins = String(sliderAutoscanDecode(sliderAutoscanGetPos()));

    if (document.getElementById("ignoreNumbers").checked) {
        args.ignoreNumbers="True";
    } else {
        args.ignoreNumbers="False";
    }
    if (document.getElementById("autoCharEncoding").selectedIndex == 0) {
        args.encodingDetect = "Auto";
    } else {
        args.encodingDetect = "Manual";
    }
    args.encoding = document.getElementById("encodingMenu").selectedItem.id;

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
              sliderThresholdMax*sliderThresholdValues);
}

function sliderThresholdSetPos(value)
{
    var slider=document.getElementById("sliderThreshold");
    slider.setAttribute("curpos",value*sliderThresholdMax /
            sliderThresholdValues);
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
              sliderAutoscanMax*sliderAutoscanValues);
}

function sliderAutoscanSetPos(value)
{
    var slider=document.getElementById("sliderAutoscan");
    slider.setAttribute("curpos",value*sliderAutoscanMax /
            sliderAutoscanValues);
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
  // Create a treerow for the new item
  var item = doc.createElement('menuitem');

  // Copy over the attributes
  item.setAttribute('label', UIstring);
  item.setAttribute('id', ID);

  menu.appendChild(item);
}
