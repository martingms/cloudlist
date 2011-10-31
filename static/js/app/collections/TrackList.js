// TrackList.js

// A collection of tracks as showed in the UI. _Note that the `TrackList` collection should not be mixed up
// with the `Playlist` model, as they represent different things. Currently, the only thing defined for this
// collection is the model which it referes to (`Track`), and at what url requests should be made.
//
// + **TODO** Explain better the difference.
//
var TrackList = Backbone.Collection.extend({

  model: Track,
  url: '/ajax/tracks'

});
