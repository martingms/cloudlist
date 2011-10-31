// Playlist.js


// The playlist model uses an extension of the standard Backbone.Model; [Backbone-relational](https://github.com/PaulUithol/Backbone-relational).
// Backbone-relational is used to emulate a relational relationship akin to those in a normal relational database.
//
// + **TODO** This model is not used yet. Will need some writing.
var Playlist = Backbone.RelationalModel.extend({

  relations: [
    {
      type : Backbone.HasMany,
      key  : 'tracks',
      relatedModel : 'Track'
    }
  ]

});
