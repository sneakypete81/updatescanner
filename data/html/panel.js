// Send a message when the "show sidebar" link is clicked
$(function() {
  $("#sidebar_show").click(function(e) {
    addon.port.emit("sidebar_show");
  });
});
