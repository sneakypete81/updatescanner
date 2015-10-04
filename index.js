var buttons = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");

var sidebar = require("sdk/ui/sidebar").Sidebar({
  id: 'updatescanner-sidebar',
  title: 'Update Scanner',
  url: "./html/sidebar.html",
});

var button = buttons.ToggleButton({
  id: "updatescanner-button",
  label: "Open Update Scanner Sidebar",
  icon: {
    "18": "./images/updatescan-18.png", // @TODO: Should be 16!
    "48": "./images/updatescan-48.png", // @TODO: Should be 32!
    "64": "./images/updatescan-64.png",
  },
  badge: 2,
  onChange: handleButtonChange
});

var panel = panels.Panel({
  contentURL: "./html/panel.html",
  onHide: handlePanelHide
});
panel.port.on("sidebar_show", handleSidebarShowRequest);


function handleButtonChange(state) {
  // Show the panel when the button is clicked
  if (state.checked) {
    panel.show({position: button});
  }
}

function handlePanelHide() {
  // Uncheck the button when the panel disappears
  button.state('window', {checked: false});
}

function handleSidebarShowRequest() {
  sidebar.show();
  panel.hide();
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
