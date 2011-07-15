//
// app/models/playlist.js
//
// Uses Backbone-relational (https://github.com/PaulUithol/Backbone-relational)
//

var Playlist = Backbone.RelationalModel.extend({

  relations: [
    type : Backbone.HasMany,
    key  : 'tracks',
    relatedModel : 'Track'
  ]

});
