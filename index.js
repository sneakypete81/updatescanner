var buttons = require('sdk/ui/button/toggle');
var tabs = require("sdk/tabs");

var sidebar = require("sdk/ui/sidebar").Sidebar({
  id: 'updatescanner-sidebar',
  title: 'Update Scanner',
  url: "./html/sidebar.html",
  onShow: handleSidebarShow,
  onHide: handleSidebarHide
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

// var buttonClicking = false;

function handleButtonChange(state) {
  // buttonClicking = true;
  if (state.checked) {
    console.log("showing");
    sidebar.show();
  } else {
    console.log("hiding");
    sidebar.hide();
  }
  // buttonClicking = false;
}

function handleSidebarShow() {
  button.state("window", {checked: true});
}

function handleSidebarHide() {
  button.state("window", {checked: false});
}

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
