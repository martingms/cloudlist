// Track.js

var Track = Backbone.Model.extend({

  // `initialize` - Called on initialization of a new track.
  //
  //  + **TODO** Add to current playlists 'tracks' attribute
  //
  initialize: function() {
    // Getting the hostname from an inputted url. getHostname() is defined in utils.js
    //
    //     'http://soundcloud.com/artist/track'.getHostname();
    //       returns: 'soundcloud.com'
    var host = this.get('url').getHostname();

    // An object that holds all attributes that should not be backed up to the
    // database.
    this.nonpersistant = {};

    this.nonpersistant.handler = newTrackHandler(this.get('url'), this);
    //this.set({ handler: newTrackHandler(this.get('url'), this) });

  },

  playpause: function() {
    this.nonpersistant.handler.playpause();
  },

  play: function() {
    // FIXME These two should be abstracted to a stopall function
    soundManager.stopAll();
    ytplayer.stopVideo();
    this.nonpersistant.handler.play();
  },

  restartTrack: function() {
    this.nonpersistant.handler.play();
  }

});
