//
//
//
//

App.Controllers.PlaylistList = Backbone.Controller.extend({
  routes: {
    '' : 'showPlaylists'
  },

  showPlaylists: function() {
    var playlists = new App.Collections.PlaylistList();
    playlists.fetch({
      success: function() {
        new App.Views.PlaylistList({ collection: playlists });
      },
      error: function() {
        new Error({ message: 'Error loading playlists, or no playlists available' });
      }
    });
  }
});
