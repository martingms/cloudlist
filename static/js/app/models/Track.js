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
    //var host = this.get('url').getHostname();

    this.trackhandler = newTrackHandler(this);

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
