$(function () {
  // Create an instance when the DOM is ready
  $("#jstree").jstree();
  // Bind to events triggered on the tree
  $("#jstree").on("changed.jstree", function (e, data) {
    console.log(data.selected);
  });
});

function load_iframe(html) {
  var iframe = document.createElement("iframe")
  iframe.id = "frame"
  iframe.sandbox = ""
  iframe.srcdoc = html
  document.querySelector("#main").appendChild(iframe)
}

html = "<h1>Hello</h1><script src='hello.js'></script><p style='margin-top:200em'>Some more text</p>"
load_iframe(html)
// $(".sidebar").height(Math.max($(".content").height(),$(".sidebar").height()));
