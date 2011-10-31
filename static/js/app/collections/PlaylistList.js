// PlaylistList.js

// A collection of playlists.
var PlaylistList = Backbone.Collection.extend({

  model: Playlist,
  url: '/ajax/playlists'

});
