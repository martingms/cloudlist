// outro.js


  // Kicking it all off
  // ------------------

  // When soundmanager2 is loaded, start the entire app by creating a new _TrackListView_.
  //
  // + **FIXME** Chaining _onready_s is rather ugly.
  // + **TODO** Start the app through a router instead of a view.
  // + **TODO** Start history once pushState urls is implemented.
  soundManager.onready(function() {
    var Tracklist = new TracklistView();
  });

});

// Ugly hack for sending messages between views etc. FIXME
var globalEvents = {};

_.extend(globalEvents, Backbone.Events);

function ytPlayerStateChange(newState) {
  globalEvents.trigger('ytPlayerStateChange', newState);
}

// Fucking youtube
function onYouTubePlayerReady() {
  ytplayer.addEventListener('onStateChange', 'ytPlayerStateChange');
}
