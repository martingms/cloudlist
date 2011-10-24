/*
 *   app.js //TODO ascii art for realz
 *
 */

// Defining globals
window.playlists = {};
var next_track_to_add = 1;
var appendqueue = [];
var consumer_key = '768e41058531333626dd3e913010661a';
var templates = {
  litrack: $('#track-template').html()
};

$(function() {

  ////////////////////
  // Initialization //
  ////////////////////

  // START EXPERIMENTING FIXME FIXME FIXME

  initialize();

  /*

  $('body').ajaxComplete(function() {
    var activeplaylist = playlists.Godlista;
    var length = Object.keys(activeplaylist.tracks).length;

    for (var i = 1; i < length; i++) {
      console.log(activeplaylist.tracks[i].title);
      addTrackToDOM(activeplaylist.tracks[i], i);
    }
  });

  */

  // END EXPERIMENTING FIXME FIXME FIXME

  ////////////////////
  // Binding events //
  ////////////////////

  // When plus-icon clicked, show input field.
  $('#add').click(function() {
    $('#add-track-input').fadeToggle();
  });

  // When enter pressed in new track input field, save to server and add to bottom of playlist
  $('#add-track-input').keypress(function(e) {
    // If key pressed is not enter(13), return nothing.
    if (e.which != 13) return;

    var url = $(this).val();
    var playlist = $('#plnview').html(); //TODO get playlist from somewhere else? e.g. global playlist element

    saveTrack(playlist, url);
    $(this).fadeOut();
  });

  // When playlist name clicked, transform to input field.
  $('#plnview').click(function() {
    var $this = $(this);
    var $input = $('#plneditinput');
    $input.attr('placeholder', $this.html());
    $this.hide();
    $('#plnedit').show();
  });

  // When enter pressed in playlist name input field, save to server and transform to <p>
  $('#plneditinput').keypress(function(e) {
    if (e.which != 13) return;
    //TODO ajax etc..
    $plnview = $('#plnview');
    $plnview.html($('#plneditinput').val());
    $('#plnedit').hide();
    $plnview.show();
  });

});


//////////////////////
// Helper functions //
//////////////////////

// Fetches all playlists from server and adds them to global playlists object.
// TODO Only fetch playlists that logged in user owns or subscribes to.
function initialize() {
  $.getJSON('/playlist', function(data) {
    for (var playlist in data) {
      if (data.hasOwnProperty(playlist)) {
        playlists[playlist] = { tracks: data[playlist].tracks, owner: 'Martin' }; //FIXME dummy owner for now.
        for (var track in data[playlist].tracks) {
          getTrackInfo(playlists[playlist].tracks[track], track, playlist);
        }
      }
    }
  });

  return playlists;
}

// Takes a track object and appends it to the tracklist. 
// trackid should be its number in the playlist / its key in the playlist object.
function addTrackToDOM(track, trackid) {
  var templatedata = {
    title    : function() {
      if (track.title.length > 50) {
        return track.title.slice(0,47)+'...';
      } else {
        return track.title;
      }
    }(),
    duration : track.duration,
    id       : trackid
  };

  var newtrack = Mustache.to_html(templates.litrack, templatedata);
  $('ol.tracks').append(newtrack); //FIXME maybe make the element to append to an argument?
}

// Takes a playlist string and an url and saves it to server. Then adds that track to the active playlist element.
function saveTrack(playlist, url) {
  $.ajax({
    url      : '/tracks',
    data     : {
      playlist : playlist,
      url      : url
    },
    type     : 'POST',
    dataType : 'json',
    success  : function(track) {
      getTrackInfo(track, track.trackid, playlist);
    }
  });
}

// Saves new playlist name to server. If new playlist creates new.
function savePlaylist(newname, oldname) {
  return;
}

// Queues up tracks to be added so they are added in the right sequence.
// TODO This was written at the end of a 20 hour coding marathon, should probably be rewritten.
function addToAppendQueue(track, trackid) {
  if (trackid == next_track_to_add) {
    addTrackToDOM(track, trackid);
    next_track_to_add++;
  } else {
    appendqueue.push({id:trackid,track:track});
  }

  //FIXME catch TypeError
  var found = true;
  var i = 0;
  while (found) {
    if (appendqueue[i].id == next_track_to_add) {
      addTrackToDOM(appendqueue[i].track, appendqueue[i].id);
      next_track_to_add++;
      appendqueue.splice(i,1);
      i = 0;
    } else if (i == appendqueue.length - 1) {
      found = false;
    } else {
      i++;
    }
  }
}

// Gets track info through specialized functions for different tracktypes.
// Data should look like this:
//    track = { url: 'http://soundcloud.com/xy/zz', type: 'sc' }
function getTrackInfo(track, trackid, playlist) {
  switch(track.type) {
    case 'sc':
      getScTrackInfo(track, trackid, playlist);
      break;
    case 'yt':
      getYtTrackInfo(track.url);
      break;
    case 'hm':
      getHmTrackInfo(track.url);
      break;
  }
}

// Gets track info for a soundcloud track and adds the info to global playlists object.
// Only to be used through getTrackInfo()!
function getScTrackInfo(track, trackid, playlist) {
  var apiurl = 'http://api.soundcloud.com/resolve?url='+track.url+'&format=json&consumer_key='+consumer_key+'&callback=?';

  $.getJSON(apiurl, function(scdata) {
    // What scdata contains can be seen here: http://developers.soundcloud.com/docs/api/tracks
    if (!playlists[playlist].tracks[trackid]) {
      playlists[playlist].tracks[trackid] = track;
    }
    $.extend(playlists[playlist].tracks[trackid], {
      title       : scdata.title,
      artworkurl  : scdata.artwork_url,
      streamurl   : scdata.stream_url,
      downloadurl : scdata.download_url,
      user        : { username: scdata.user.username, userurl: scdata.user.permalink_url },
      duration    : function() {
        var minutes = scdata.duration / 1000 / 60;
        var floormin = Math.floor(minutes);
        var seconds = Math.floor((minutes - floormin) * 60);
        if (seconds <= 10) seconds = seconds + '0';
        return floormin + ':' + seconds;
      }()
    });
    addToAppendQueue(playlists[playlist].tracks[trackid], trackid);

  });
}

// TODO
function getYtTrackInfo(url) {
  return;
}

// TODO
function getHmTrackInfo(url) {
  return;
}
