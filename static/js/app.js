//
//     app.js
//     2011 Martin Gammelsæter
//

$(function() {
// mainhandler.js

function newTrackHandler(url, model) {
  var host = url.getHostname();

  // Chooses which function to use for fetching track info based on link hostname.
  switch (host) {
    case 'soundcloud.com':
      return new SoundcloudTrackHandler(url, model);
      break;
    case 'youtube.com', 'www.youtube.com':
      //this.set({ ytid: this.get('url').getYtVideoId() });
      return new YouTubeTrackHandler(url, model);
      break;
    default:
      console.log("This source (" + url + ") is not yet supported.");
  }
};
// soundcloudTrackHandler.js

function SoundcloudTrackHandler(url, model) {
  var that = this;
  var apiurl = 'http://api.soundcloud.com/resolve?url='+url+'&format=json&consumer_key='+settings.sc_consumer_key+'&callback=?';

  $.getJSON(apiurl, function(data) {

    that.type = 'sc';
    that.title = data.title;
    that.artworkurl = data.artwork_url;
    that.downloadurl = data.download_url;
    that.user = { username: data.user.username, userurl: data.user.permalink_url };
    that.duration = function() {
      var minutes = data.duration / 1000 / 60;
      var floormin = Math.floor(minutes);
      var seconds = Math.floor((minutes - floormin) * 60);
      if (seconds <= 10) seconds = seconds + '0';
      return floormin + ':' + seconds;
    }();
    // If title has greater than 50 characters, make a short version that is truncated at 47 and ends with ellipsis to signify that it is truncated.
    that.shorttitle = function() {
      if (data.title.length > 50) {
        return data.title.slice(0,47)+'...';
      } else {
        return data.title;
      }
    }();
    // Creates a soundmanager2 sound for the track, so it can be easily played on demand.
    // FIXME sound should probably not be available outside this function
    that.sound = soundManager.createSound({
      id  : 'track_' + that.id,
      url : function() {
        var url = data.stream_url;
        url = (url.indexOf('secret_token') == -1) ? url + '?' : url + '&';
        return url + 'consumer_key=' + settings.sc_consumer_key;
      }(),
      onfinish: function() {
        that.collection.trigger('trackFinished', that);
      }
    })
    // Because of the async call, the change event is triggered manually.
    model.change(that);
  });

  that.playpause = function() {
    // FIXME sound should be private somehow, same as above.
    that.sound.togglePause();
  };

  that.play = function() {
    that.sound.play();
  };

  that.restartTrack = function() {
    // FIXME should probably not use soundManager directly here
    soundManager.stopAll();
    that.sound.play();
  };

};
// YouTubeTrackHandler.js

function YouTubeTrackHandler(url, model) {
  var that = this;
  that.ytid = model.get('url').getYtVideoId();
  var apiurl = 'https://gdata.youtube.com/feeds/api/videos/'+that.ytid+'?alt=json';

  $.ajax({
    url        : apiurl,
    dataType   : 'jsonp',
    beforeSend : function(jqXHR) {
      jqXHR.setRequestHeader('GData-Version', 2);
      jqXHR.setRequestHeader('X-GData-Key', 'key='+settings.yt_developer_key);
    },
    success    : function(ytdata) {
      // What _ytdata_ contains can be tried out with youtube's interactive [demo](http://gdata.youtube.com/demo/index.html).
      that.type = 'yt';
      that.title = ytdata.entry.title.$t;
      that.artworkurl = ytdata.entry.media$group.media$thumbnail[0].url;
      that.user = { username: ytdata.entry.author[0].name.$t, userurl: ytdata.entry.author[0].uri.$t };
      that.duration = function() {
        var totalSeconds = ytdata.entry.media$group.yt$duration.seconds;
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = Math.floor(((totalSeconds / 60)-minutes) * 60);
        if (seconds <= 10) seconds = '0' + seconds;
        return minutes + ':' + seconds;
      }();
      // TODO shorten title if > 50 chars
      that.shorttitle = ytdata.entry.title.$t;
      model.change(that);
    }
  });

  that.playpause = function() {
    switch (ytplayer.getPlayerState()) {
      case -1:
        ytplayer.loadVideoById(model.get('ytid'));
        break;
      case 2:
        ytplayer.playVideo();
        break;
      default:
        ytplayer.pauseVideo();
    }
  };

  that.play = function() {
    ytplayer.loadVideoById(that.ytid);
  };

  that.restartTrack = function() {
    ytplayer.seekTo(0);
  };
}
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
// PlaylistList.js

// A collection of playlists.
var PlaylistList = Backbone.Collection.extend({

  model: Playlist,
  url: '/ajax/playlists'

});
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
// TrackView.js

// The view for a single track in the tracklist.
var TrackView = Backbone.View.extend({

  // The tag to encapsulate an instance of the view.
  tagName: 'li',

  // The class name of the encapsulating tag.
  className: 'track',

  // The template for the track. This is currently defined in the index jinja2 template.
  //
  // + **TODO** Make all templates separate files, and include them in some other way.
  template: $('#track-template').html(),

  events: {
    'dblclick' : 'gotoTrack'
  },

  // When a new instance of TrackView is initialized:
  initialize: function() {
    _.bindAll(this, 'render', 'togglePlaying', 'gotoTrack');
    // Bind the _change_ event so that every time a change occurs on the corresponding track, call the render function.
    this.model.bind('change', this.render);
    // Give the track a reference to its view for convenience.
    this.model.view = this;
    this.render();
  },

  render: function() {
    // Using [mustache.js](https://github.com/janl/mustache.js) for templating. This forces logic out of the templates pretty well.
    var html = Mustache.to_html(this.template, _.clone(this.model.nonpersistant)); // Show a spinner before title is loaded

    console.log(this.model);
    $(this.el).html(html);

    // Returning _this_ (the model instance) to make chaining possible.
    return this;
  },

  togglePlaying: function() {
    $(this.el).toggleClass('playing');

    return this;
  },

  removePlaying: function() {
    $(this.el).removeClass('playing');

    return this;
  },

  gotoTrack: function() {
    this.model.collection.trigger('gotoTrack', this.model);
  }

});
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
    _.bindAll(this, 'render', 'playpause', 'skipToNextTrack', 'gotoTrack', 'onYtPlayerStateChange', 'onTrackFinished', 'startProgressBar');

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

    return this;
  },

  // `playpause` - Does what it says on the tin, triggered when play or pause button on player is pressed.
  playpause: function() {
    this.nextTrack.playpause();
    clearInterval(this.nextTrack.interval);
    this.nextTrack.interval = null;
    $('#play, #pause').toggle();
    this.startProgressBar();
    this.nextTrack.view.togglePlaying();
  },

  // `skipToNextTrack` - Skips ahead to the next track in the list. Called when the next-button is pressed.
  skipToNextTrack: function() {
    // Remove class _playing_ from current track.
    this.nextTrack.view.removePlaying();
    clearInterval(this.nextTrack.interval);
    this.nextTrack.interval = null;
    if (this.nextTrack == this.collection.last()) {
      this.nextTrack = this.collection.first();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)+1);
    }
    this.startProgressBar();
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  },

  // `skipToPrevTrack` - Skips back to the previous track in the list. Called when the previous-button is doubleclicked.
  skipToPrevTrack: function() {
    this.nextTrack.view.removePlaying();
    clearInterval(this.nextTrack.interval);
    this.nextTrack.interval = null;
    if (this.nextTrack == this.collection.first()) {
      this.nextTrack = this.collection.last();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)-1);
    }
    this.startProgressBar();
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
    clearInterval(this.nextTrack.interval);
    this.nextTrack.interval = null;
    this.nextTrack = track;
    this.startProgressBar();
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
    clearInterval(this.nextTrack.interval);
    this.nextTrack.interval = null;
    // TODO if last track, goto first
    if (this.nextTrack == this.collection.last()) {
      this.nextTrack = this.collection.first();
    } else {
      this.nextTrack = this.collection.at(this.collection.indexOf(track)+1);
    }
    this.startProgressBar();
    this.nextTrack.play();
    this.nextTrack.view.togglePlaying();
    this.render();
    $('#play, #pause').toggle();
  },

  startProgressBar: function() {
    var that = this;
    switch (this.nextTrack.get('type')) {
      case 'sc':
        var sound = this.nextTrack.get('sound');
        var duration, progress;
        this.nextTrack.interval = setInterval(function() {
          // If song fully loaded, get real duration, if not, get an estimate.
          duration = sound.duration || sound.durationEstimate;
          progress = sound.position / duration;
          $('#elapsed').css('width', 100 * progress + '%');
          console.log('Duration: '+duration);
          console.log('Progress (%): '+100*progress);
          console.log('Position: '+sound.position);
        }, 500);
      case 'yt':
        var duration, progress;
        var timecounter = 0;
        this.nextTrack.interval = setInterval(function() {
          timecounter += 0.5;
          duration = ytplayer.getDuration();
          progress = timecounter / duration;
          $('#elapsed').css('width', 100 * progress + '%');
        }, 500);
    }

  }

});
// TracklistView.js


// The view for the whole tracklist. Renders one _collection of tracks_.
var TracklistView = Backbone.View.extend({

  el: $('#tracklist'),

  events: {
    'click #add'                : 'showInput',
    'keypress #add-track-input' : 'addTrackOnEnter'
  },

  initialize: function() {
    _.bindAll(this, 'render', 'addTrackOnEnter', 'showInput');

    // _input_ is set to be the (hidden) text input field.
    this.input = this.$('#add-track-input');
    // Creating an instance of a _TrackList_.
    this.collection = new TrackList();
    // If a _Track_ is added to the colllection, call `appendTrack`.
    this.collection.bind('add', this.appendTrack);

    var that = this;
    this.collection.fetch({
      // If fetch from server was successful...
      success: function(model, response) {
        // Append each track to TracklistView with `appendTrack`.
        //
        // + **TODO** There is probably a better way to do this, perhaps through a template that renders a whole collection.
        for (var track in that.collection.models) {
          that.appendTrack(that.collection.models[track]);
        }
        // Also, create a new `PlayerView` with the fetched collection as input.
        // That view now handles all playback of the current tracklist.
        this.playerview = new PlayerView({ collection: that.collection });
      },
      // If fetch from server was erroneous...
      error: function(model, response) {
        // Raise an error with a meaningful message.
        //
        // + **TODO** Create a view for errors, that shows them conveniently in the DOM.
        new Error('Something went wrong! This was the response: ' + response);
      }
    });

  },

  // This view does not actually call the `render`-function ever.
  //
  // + **TODO** Maybe most of the functionality of this view should be moved to a router?
  render: function() {
    return this;
  },

  // `appendTrack` - Creates a new _TrackView_ for every added track, and appends it to the DOM.
  appendTrack: function(track) {
    var view = new TrackView({ model: track });
    $('ol.tracks').append(view.render().el);
  },

  // `addTrackOnEnter` - Called every time a key is pressed while the _input_-field is in focus.
  //
  // + **TODO** Add some validation on url.
  addTrackOnEnter: function(e) {
    // If the key is not enter (keycode 13), just return the function.
    if (e.keyCode != 13) return;
    // Else, create a new _Track_ through the collections build in `create` method.
    var model = this.collection.create({
      url: this.input.val()
    });

    // If the newly added track is the first in the collection, initialize the player again.
    if (this.collection.length == 1 && this.playerview) {
      this.playerview.initialize();
    }

    // Reset the input value to the empty string and fade out the field upon completion.
    //
    // + **TODO** Only do this if adding of track is successful, if not show a descriptive error message.
    this.input.val('').fadeOut();
  },

  showInput: function() {
    this.input.fadeToggle();
  }

});
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
// settings.js

// A global object for storing all kinds of settings.
var settings = {
  sc_consumer_key  : '768e41058531333626dd3e913010661a',
  yt_developer_key : 'AI39si6wOs6S58ih1SeRvHNLVtkzXVSO0xHIjy7Au3kuzXEr3yqYUVduuKfxvErG7VJkcL_Q9X1FIhcj42cfVbW6EwDLBIVrBA'
};


// soundmanager2 default settings.
soundManager.url = '/static/swf/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;
//
// utils.js
//
// All kinds of utility functions not suited for inclusion in an app
// but needed none the less.


// Returns the hostname of an url. Only accepts ftp, http and https as protocols.
// Example:
// 'http://soundcloud.com/theglitchmob/daft-punk-derezzed-the-glitch'.getHostname();
// returns 'soundcloud.com'
String.prototype.getHostname = function() {
  var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
  return this.match(re)[1].toString();
};

String.prototype.getYtVideoId = function() {
  var video_id = this.split('v=')[1];
  var ampersandPosition = video_id.indexOf('&');
  if (ampersandPosition != -1) {
    return video_id.substring(0, ampersandPosition);
  } else {
    return video_id;
  }
};
