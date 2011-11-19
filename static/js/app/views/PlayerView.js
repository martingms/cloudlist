// PlayerView.js

// The view for the player itself.
var PlayerView = Backbone.View.extend({

  // The `div` element this view should populate.
  el: $('#player'),

  template: $('#player-template').html(),

  events: {
    'click #play'               : 'playpause',
    'click #pause'              : 'playpause',
    'click #next'               : 'skipToNextTrack',
    'click #previous'           : 'restartTrack',
    'dblclick #previous'        : 'skipToPrevTrack'
  },

  // Fetching the ytplayer element with getElementById because jQuery wraps the element so that
  // playback functions won't work.

  initialize: function() {
    _.bindAll(this, 'render', 'playpause', 'skipToNextTrack', 'gotoTrack', 'onYtPlayerStateChange', 'onTrackFinished');

    if (this.collection.length > 0) {
      var that = this;
      globalEvents.bind('ytPlayerStateChange', this.onYtPlayerStateChange);
      this.collection.bind('trackFinished', this.onTrackFinished);
      this.collection.bind('gotoTrack', this.gotoTrack);

      // _nextTrack_ should always point to the next track to be played unless there is any skipping etc.
      // At initialization, this is the first track in the collection.
      this.nextTrack = this.collection.first();
      this.nextTrack.bind('change', this.render);
    }
  },

  render: function() {
    var html = Mustache.to_html(this.template, _.clone(this.nextTrack.nonpersistant));
    this.el.html(html);

    that = this;

    // Every half second, checks for progress on nextTrack
    setInterval(function() {
      $('#elapsed').css('width', 100 * that.nextTrack.nonpersistant.handler.progress() + '%');
    }, 500);

    return this;
  },

  // `playpause` - Does what it says on the tin, triggered when play or pause button on player is pressed.
  playpause: function() {
    this.nextTrack.playpause();
    $('#play, #pause').toggle();
    this.nextTrack.view.togglePlaying();
  },

  // `skipToNextTrack` - Skips ahead to the next track in the list. Called when the next-button is pressed.
  skipToNextTrack: function() {
    // Remove class _playing_ from current track.
    this.nextTrack.view.removePlaying();
    if (this.nextTrack == this.collection.last()) {
      this.nextTrack = this.collection.first();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)+1);
    }
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  },

  // `skipToPrevTrack` - Skips back to the previous track in the list. Called when the previous-button is doubleclicked.
  skipToPrevTrack: function() {
    this.nextTrack.view.removePlaying();
    if (this.nextTrack == this.collection.first()) {
      this.nextTrack = this.collection.last();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)-1);
    }
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  },

  // `restartTrack` - Restarts the current track. Called when the previous-button is pressed once.
  // TODO should not be needed, go straight to nextTrack.restartTrack()
  restartTrack: function() {
    this.nextTrack.restartTrack();
  },

  gotoTrack: function(track) {
    this.nextTrack.view.removePlaying();
    this.nextTrack = track;
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  },

  onYtPlayerStateChange: function(state) {
    switch (state) {
      // Track ended
      case 0:
        this.onTrackFinished(this.nextTrack);
    }
  },

  onTrackFinished: function(track) {
    track.view.removePlaying();
    // TODO if last track, goto first
    if (this.nextTrack == this.collection.last()) {
      this.nextTrack = this.collection.first();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(track)+1);
    }
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  }

});
