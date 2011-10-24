//
//
//
//

App.Controllers.Tracklist = Backbone.Controller.extend({
  routes: {
    'playlist/:id' : 'showPlaylist',
    'playlist/new' : 'newPlaylist'
  },

  showPlaylist: function(id) {
    var playlist = new Playlist({ id: id });
    playlist.fetch({
      success: function(model, resp) {
        var tracks = playlist.get('tracks'); // Might need a new fetch here?
        var tracklist = new App.Collections.Tracklist(tracks);

        new App.Views.Playlist({ collection: tracklist });
      },

      error: function() {
        new Error({ message: 'Could not find that playlist...' });
      }
    });
  },

  newPlaylist: function() {
    new App.Views.NewPlaylist({ model: new Playlist() });
  }
});
