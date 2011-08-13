//
//     bbapp.js
//     (c) 2011 Martin Gammelsæter
//


// A global object for storing all kinds of settings. If possible all configuration should be done here.
var settings = {
  sc_consumer_key  : '768e41058531333626dd3e913010661a',
  yt_developer_key : 'AI39si6wOs6S58ih1SeRvHNLVtkzXVSO0xHIjy7Au3kuzXEr3yqYUVduuKfxvErG7VJkcL_Q9X1FIhcj42cfVbW6EwDLBIVrBA'
};

// soundmanager2 default settings. 
//
// + **TODO** Move this somewhere else.
//
soundManager.url = '/static/swf/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;

$(function() {

  // Track model
  // -----------
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

      // Chooses which function to use for fetching track info based on link hostname.
      switch (host) {
        case 'soundcloud.com':
          this.getScTrackInfo();
          break;
        case 'youtube.com', 'www.youtube.com':
          this.set({ ytid: this.get('url').getYtVideoId() });
          this.getYtTrackInfo();
          break;
      }
    },

    // `getScTrackInfo` - Called by Track.initialize if new track url hostname is _souncloud.com_.
    getScTrackInfo: function() {
      // Here, _this_ refers to the model in question. This reference is saved to the variable _that_ to avoid losing the reference deeper in the function.
      var that = this;
      var apiurl = 'http://api.soundcloud.com/resolve?url='+this.get('url')+'&format=json&consumer_key='+settings.sc_consumer_key+'&callback=?';

      $.getJSON(apiurl, function(scdata) {
        // What _scdata_ contains can be seen [here](http://developers.soundcloud.com/docs/api/tracks).
        that.set({
          // _type_ is set so the player can determine how to play the track.
          type        : 'sc',
          title       : scdata.title,
          artworkurl  : scdata.artwork_url,
          downloadurl : scdata.download_url,
          user        : { username: scdata.user.username, userurl: scdata.user.permalink_url },
          // Duration is returned in milliseconds, for now this is changed on the fly to the more common _mm:ss_ format.
          //
          // + **TODO** Make it return _hh:mm:ss_ if the duration is greater than one hour.
          // + **TODO** Also have a redundant duration in milliseconds, if it is needed by the progress bar.
          // + **TODO** Move duration function to utils.js, taking ms or s or m or whatever as second argument.
          duration    : function() {
            var minutes = scdata.duration / 1000 / 60;
            var floormin = Math.floor(minutes);
            var seconds = Math.floor((minutes - floormin) * 60);
            if (seconds <= 10) seconds = seconds + '0';
            return floormin + ':' + seconds;
          }(),
          // If title has greater than 50 characters, make a short version that is truncated at 47 and ends with ellipsis to signify that it is truncated.
          shorttitle  : function() {
            if (scdata.title.length > 50) {
              return scdata.title.slice(0,47)+'...';
            } else {
              return scdata.title;
            }
          }(),
          // Creates a soundmanager2 sound for the track, so it can be easily played on demand.
          sound       : soundManager.createSound({
            id  : 'track_' + that.id,
            url : function() {
              var url = scdata.stream_url;
              url = (url.indexOf('secret_token') == -1) ? url + '?' : url + '&';
              return url + 'consumer_key=' + settings.sc_consumer_key;
            }(),
            onfinish: function() {
              that.collection.trigger('trackFinished', that);
            }
          })
        });
      });
    },

    // `getYtTrackInfo` - Called by Track.initialize if new track url hostname is _youtube.com_.
    //
    // + **TODO** Write the function.
    getYtTrackInfo: function() {
      var that = this;
      var apiurl = 'https://gdata.youtube.com/feeds/api/videos/'+this.get('ytid')+'?alt=json';

      $.ajax({
        url        : apiurl,
        dataType   : 'jsonp',
        beforeSend : function(jqXHR) {
          jqXHR.setRequestHeader('GData-Version', 2);
          jqXHR.setRequestHeader('X-GData-Key', 'key='+settings.yt_developer_key);
        },
        success    : function(ytdata) {
          // What _ytdata_ contains can be tried out with youtube's interactive [demo](http://gdata.youtube.com/demo/index.html).
          that.set({
            type       : 'yt',
            title      : ytdata.entry.title.$t,
            artworkurl : ytdata.entry.media$group.media$thumbnail[0].url,
            user       : { username: ytdata.entry.author[0].name.$t, userurl: ytdata.entry.author[0].uri.$t },
            duration   : function() {
              var totalSeconds = ytdata.entry.media$group.yt$duration.seconds;
              var minutes = Math.floor(totalSeconds / 60);
              var seconds = Math.floor(((totalSeconds / 60)-minutes) * 60);
              if (seconds <= 10) seconds = '0' + seconds;
              return minutes + ':' + seconds;
            },
            // TODO shorten title if > 50 chars
            shorttitle : ytdata.entry.title.$t
          });
        }
      });
    },

    playpause: function() {
      switch (this.get('type')) {
        case 'sc':
          this.get('sound').togglePause();
          break;
        case 'yt':
          switch (ytplayer.getPlayerState()) {
            case -1:
              ytplayer.loadVideoById(this.get('ytid'));
              break;
            case 2:
              ytplayer.playVideo();
              break;
            default:
              ytplayer.pauseVideo();
          }
          break;
      }
    },

    play: function() {
      soundManager.stopAll();
      ytplayer.stopVideo();
      switch (this.get('type')) {
        case 'sc':
          this.get('sound').play();
          break;
        case 'yt':
          ytplayer.loadVideoById(this.get('ytid'));
          break;
      }
    },

    restartTrack: function() {
      soundManager.stopAll();
      switch (this.get('type')) {
        case 'sc':
          this.get('sound').play();
          break;
        case 'yt':
          ytplayer.seekTo(0);
          break;
      }
    }

  });

  // Playlist model
  // --------------

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

  // TrackList collection
  // --------------------

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

  // PlaylistList collection
  // -----------------------

  // A collection of playlists.
  //
  // + **TODO** Write more documentation on use, when this starts to get used.

  var PlaylistList = Backbone.Collection.extend({

    model: Playlist,
    url: '/ajax/playlists'

  });

  // TrackView
  // ---------

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
      var html = Mustache.to_html(this.template, this.model.toJSON()); // Show a spinner before title is loaded
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

  // PlayerView
  // ----------

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
      'dblclick #previous'        : 'skipToPrevTrack',
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
      var html = Mustache.to_html(this.template, this.nextTrack.toJSON());
      this.el.html(html);

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
      console.log(state);
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

  // TracklistView
  // -------------

  // The view for the whole tracklist. Renders one _collection of tracks_.
  var TracklistView = Backbone.View.extend({

    el: $('#tracklist'),

    events: {
      'click #add'                : 'showInput',
      'keypress #add-track-input' : 'addTrackOnEnter',
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

  // Kicking it all off
  // ------------------

  // When soundmanager2 is loaded, start the entire app by creating a new _TrackListView_.
  //
  // + **FIXME** Chaining _onready_s is rather ugly.
  // + **TODO** Start the app through a router instead of a view.
  // + **TODO** Start history once pushState urls is implemented.
  // + **TODO** Also check if ytplayer is ready through creating `onYouTubePlayerReady()`
  soundManager.onready(function() {
    var Tracklist = new TracklistView();
  });

});

var globalEvents = {};

_.extend(globalEvents, Backbone.Events);

function ytPlayerStateChange(newState) {
  globalEvents.trigger('ytPlayerStateChange', newState);
}

function onYouTubePlayerReady() {
  ytplayer.addEventListener('onStateChange', 'ytPlayerStateChange');
}

