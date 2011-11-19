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
    });

    that.progress = function() { return (that.sound.position || 0) / (that.sound.duration || that.sound.durationEstimate) };

    // Because of the async call, the change event is triggered manually.
    model.change(that);
  });

  // FIXME _duration should be called something else.
  //var _duration = that.sound.duration || sound.durationEstimate;

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
