//
//
//
//

$(function() {
  App.init();
});

var App = {
  Views: {},
  Controllers: {},
  init: function() {
    new App.Controllers.PlaylistList();
    Backbone.history.start();
  }
};
