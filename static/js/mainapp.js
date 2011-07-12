//TODO Rewrite to backbone when time, see todo-later-backbone.js
//TODO ALSO CLEAN THIS SHIT UP GODDAMIT IT IS UGLY

var consumer_key = '768e41058531333626dd3e913010661a';
soundManager.url = '/static/swf/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;

$(function() {

  $.getJSON('/tracks', function(data) {
    console.log(data.tracks);
    for (var i = 0; i < data.tracks.length; i++) {
      addTrack(data.tracks[i]);
      console.log(data.tracks[i]);
      if (i == data.tracks.length - 1) {
        setTimeout(finishedPreLoad, 1000);
      }
    }
  });

  function finishedPreLoad() {
    loadNextSong();
    $('#preload').fadeOut('fast', function() {
      $('#main').fadeIn();
    });
  }

  function loadNextSong() {
    var nexttrack = $('.track').first();
    //FIXME This could be done a lot prettier with $.data()
    var metadata = nexttrack.children('.metadata');

    var nextart = metadata.children('.artworkurl').html();
    var nexttitle = nexttrack.children('.title').html();
    var url = metadata.children('.streamurl').html();
    var trackid = metadata.children('.trackid').html();

    $('#mainart').attr('src', nextart);
    $('#trackinfo').children('.title').html(nexttitle);

    soundManager.onready(function() {
      url = (url.indexOf('secret_token') == -1) ? url + '?' : url + '&';
      url = url + 'consumer_key=' + consumer_key;

      soundManager.createSound({
        id: 'track_'+trackid,
        url: url,

        onplay: function() {
          $('#play').hide();
          $('#pause').show();
          nexttrack.addClass('active');
        },

        onresume: function() {
          $('#play').hide();
          $('#pause').show();
        },

        onpause: function() {
          $('#pause').hide();
          $('#play').show();
          nexttrack.removeClass('active');
        },

        onfinish: function() {
          return;
        }

      });

      $('#play, #pause').live('click', function() {
        soundManager.togglePause('track_'+trackid);
      });

    });

  }

  $('#add').click(function() {
    $('#add-track-input').fadeToggle();
  });

  $('#add-track-input').keypress(function(e) {
    if (e.which != 13) return;
    // add spinner here
    $.ajax({
      url: '/tracks',
      data: {
        url: $(this).val()
      },
      type: 'POST',
      dataType: 'json',
      success: function(data) {
        addTrack(data);
      }
    });
  });

  var templates = {
    track: $('#track-template').html()
  };

  function addTrack(data) {
    var scurl = data.url ? data.url : data;
    $.getJSON('http://api.soundcloud.com/resolve?url='+ scurl +'&format=json&consumer_key='+
              consumer_key+'&callback=?', function(scdata) {
      var templatedata = {
        title: function() {
          if (scdata.title.length > 50) {
            return scdata.title.slice(0,47)+'...';
          } else {
            return scdata.title
          }
        }(),
        duration: function() {
          var minutes = scdata.duration / 1000 / 60;
          var floormin = Math.floor(minutes);
          var seconds = Math.floor((minutes - floormin) * 60);
          if (seconds <= 10) seconds = seconds + '0';
          return floormin+':'+seconds;
        }(),
        artworkurl: scdata.artwork_url,
        streamurl: scdata.stream_url,
        id: scdata.id
      };

      var newtrack = Mustache.to_html(templates.track, templatedata);

      $('ol.tracks').append(newtrack);
    });
  }
});

