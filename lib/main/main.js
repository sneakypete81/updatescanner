document.addEventListener('DOMContentLoaded', init);


function init() {
  init_jstree()

  var html = "<h1>Hello</h1><script src='hello.js'></script><p style='margin-top:200em'>Some more text</p>"
  load_iframe(html)
}

function init_jstree() {
  $("#jstree").jstree()
  $("#jstree").on("changed.jstree", on_jstree_changed)
}

function on_jstree_changed(evt, data) {
  var selected_string = data.selected[0]
  if (selected_string.startsWith("id:")) {
    var id = selected_string.slice(3)
    load_html(id)
      .then(load_iframe)
      .catch(console.log.bind(console))
  }
}

function load_html(id) {
  var key = "html:" + id
  return browser.storage.local.get(key).then(function (result) {
    if (key in result) {
      return result[key]
    } else {
      throw Error("Could not retrieve key '" + key + "' from Storage")
    }
  })
}

function load_iframe(html) {
  clear_iframe()
  var iframe = document.createElement("iframe")
  iframe.id = "frame"
  iframe.sandbox = ""
  iframe.srcdoc = html
  document.querySelector("#main").appendChild(iframe)
}

function clear_iframe() {
  var iframe = document.querySelector("#frame")
  if (iframe) {
    iframe.parentNode.removeChild(iframe);
  }
}

// $(".sidebar").height(Math.max($(".content").height(),$(".sidebar").height()));
