/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UpdateScanner.PlacesBrowser = {

init : function()
{
    var tree = document.getElementById("bookmarks-view");
    tree.onclick=this.treeClick;
    var rootFolderId = UpdateScanner.Places.getRootFolderId();
    tree.place = "place:queryType=1&folder=" + rootFolderId;
},

treeClick : function(aEvent)
{
    var tree = document.getElementById("bookmarks-view");
    var tbo = tree.treeBoxObject;
    var row = { }, col = { }, obj = { };
    tbo.getCellAt(aEvent.clientX, aEvent.clientY, row, col, obj);

    if (row.value == -1 || obj.value == "twisty") {
      return;
    }

    var aNode = tree.selectedNode;
    var id = aNode.itemId;

    var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);

    var annoNames = annotationService.getItemAnnotationNames(id, {});
    var string = "";
    for (var i = 0; i < annoNames.length; i++) {
      var name = annoNames[i];
      var flags = {}, exp = {}, mimeType = {}, storageType = {};
      annotationService.getItemAnnotationInfo(id, name, flags, exp, mimeType, storageType);
      if (storageType.value == annotationService.TYPE_BINARY) {
        var data = {}, length = {}, mimeType = {};
        annotationService.geItemAnnotationBinary(id, name, data, length, mimeType);
        var val = data.value;
      } else {
        var val = annotationService.getItemAnnotation(id, name);
      }

      var type = typeof val
      string += name+"("+type+")="+val+"\n\n";
    }

    document.getElementById("text-box").value = string;
},

};