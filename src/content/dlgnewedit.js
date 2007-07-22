const sliderThresholdValues = 5;
const sliderThresholdMax = 100;
const sliderAutoscanValues = 6;
const sliderAutoscanMax = 100;

function initDialog()
{
    if (window.arguments[0] != "") {
        document.title = window.arguments[0];
    } else {
        document.title = "Update Scanner";
    }
    var results = window.arguments[1];
    document.getElementById("txtURL").value = results[0];
    document.getElementById("txtTitle").value = results[1];

    document.getElementById("sliderThreshold")
            .setAttribute("maxpos", sliderThresholdMax);
    sliderThresholdSetPos(sliderThresholdEncode(results[2]));
    sliderThresholdChange();

    document.getElementById("sliderAutoscan")
            .setAttribute("maxpos", sliderAutoscanMax);
    sliderAutoscanSetPos(sliderAutoscanEncode(results[7]));
    sliderAutoscanChange();
}

function Ok()
{
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
    
    var results = window.arguments[1];
    results[0] = txtURL.value;
    results[1] = txtTitle.value;
    results[2] = String(sliderThresholdDecode(sliderThresholdGetPos()));
    results[7] = String(sliderAutoscanDecode(sliderAutoscanGetPos()));

    return true;
}

function Cancel()
{
    var results = window.arguments[1];
    results[0] = null;
    return true;
}

function Help()
{
    var addPageTip=document.getElementById("strings").getString("addPageTip");
    alert(addPageTip);
    return true;
}

function sliderThresholdGetPos()
{
    slider=document.getElementById("sliderThreshold");
    return Math.round(slider.getAttribute("curpos") /
              sliderThresholdMax*sliderThresholdValues);
}

function sliderThresholdSetPos(value)
{
    slider=document.getElementById("sliderThreshold");
    slider.setAttribute("curpos",value*sliderThresholdMax /
            sliderThresholdValues);
}

function sliderThresholdChange() 
{
    strings=document.getElementById("strings");
    slider=document.getElementById("sliderThreshold");
    label1=document.getElementById("label1");
    label2=document.getElementById("label2");
    pos = sliderThresholdGetPos();
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
    slider=document.getElementById("sliderAutoscan");
    return Math.round(slider.getAttribute("curpos") /
              sliderAutoscanMax*sliderAutoscanValues);
}

function sliderAutoscanSetPos(value)
{
    slider=document.getElementById("sliderAutoscan");
    slider.setAttribute("curpos",value*sliderAutoscanMax /
            sliderAutoscanValues);
}

function sliderAutoscanChange() 
{
    strings=document.getElementById("strings");
    slider=document.getElementById("sliderAutoscan");
    label3=document.getElementById("label3");
    label4=document.getElementById("label4");
    pos = sliderAutoscanGetPos();
    if (pos == 0) {
        label3.value=strings.getString("autoscanLabel0a");
        label4.value=strings.getString("autoscanLabel0b");
    } else if (pos == 1) {
        label3.value=strings.getString("autoscanLabel1a");
        label4.value="";
    } else if (pos == 2) {
        label3.value=strings.getString("autoscanLabel2a");
        label4.value="";
    } else if (pos == 3) {
        label3.value=strings.getString("autoscanLabel3a");
        label4.value="";
    } else if (pos == 4) {
        label3.value=strings.getString("autoscanLabel4a");
        label4.value="";
    } else if (pos == 5) {
        label3.value=strings.getString("autoscanLabel5a");
        label4.value="";
    } else if (pos == 6) {
        label3.value=strings.getString("autoscanLabel6a");
        label4.value="";
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
