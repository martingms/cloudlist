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
