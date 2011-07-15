//
//
//
//

var settings = {
  consumer_key : '768e41058531333626dd3e913010661a'
};

soundManager.url = '/static/swf/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;

$(function() {

  var Track = Backbone.Model.extend({

    initialize: function() {
      // TODO Add to current playlists 'tracks' attribute
      var host = this.get('url').getHostname();

      // TODO Add more hosts
      switch (host) {
        case 'soundcloud.com':
          this.getScTrackInfo();
          break;
      }
    },

    getScTrackInfo: function() {
      var that = this;
      var apiurl = 'http://api.soundcloud.com/resolve?url='+this.get('url')+'&format=json&consumer_key='+settings.consumer_key+'&callback=?';

      $.getJSON(apiurl, function(scdata) {
        // What scdata contains can be seen here: http://developers.soundcloud.com/docs/api/tracks
        that.set({
          type        : 'sc',
          title       : scdata.title,
          artworkurl  : scdata.artwork_url,
          downloadurl : scdata.download_url,
          user        : { username: scdata.user.username, userurl: scdata.user.permalink_url },
          duration    : function() {
            var minutes = scdata.duration / 1000 / 60;
            var floormin = Math.floor(minutes);
            var seconds = Math.floor((minutes - floormin) * 60);
            if (seconds <= 10) seconds = seconds + '0';
            return floormin + ':' + seconds;
          }(),
          shorttitle  : function() {
            if (scdata.title.length > 50) {
              return scdata.title.slice(0,47)+'...';
            } else {
              return scdata.title;
            }
          }(),
          sound       : soundManager.createSound({
            id  : 'track_' + that.id,
            url : function() {
              var url = scdata.stream_url;
              url = (url.indexOf('secret_token') == -1) ? url + '?' : url + '&';
              return url + 'consumer_key=' + settings.consumer_key;
            }()
          })
        });
      });
    }

  });

  var Playlist = Backbone.RelationalModel.extend({

    relations: [
      {
        type : Backbone.HasMany,
        key  : 'tracks',
        relatedModel : 'Track'
      }
    ]

  });

  var TrackList = Backbone.Collection.extend({

    model: Track,
    url: '/ajax/tracks'

  });
  // FIXME moved here so PlayerView could access it, it doesn't look pretty however...
  var tracklist = new TrackList();

  var PlaylistList = Backbone.Collection.extend({

    model: Playlist,
    url: '/ajax/playlists'

  });

  var TrackView = Backbone.View.extend({

    tagName: 'li',

    className: 'tracks',

    template: $('#track-template').html(),

    events: {},

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
      this.render(); // TODO maybe only render when title found?
    },

    render: function() {
      var html = Mustache.to_html(this.template, this.model.toJSON());
      $(this.el).html(html);

      return this;
    },

  });

  var PlayerView = Backbone.View.extend({

    el: $('#player'),

    preloadtemplate: $('#player-preload-template').html(),
    template: $('#player-template').html(),

    events: {
      'click #play'               : 'playpause',
      'click #pause'              : 'playpause',
      'click img.preloadplay'     : 'render',
      'click #next'               : 'skipToNextTrack',
      'click #previous'           : 'restartTrack',
      'dblclick #previous'        : 'skipToPrevTrack'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'playpause', 'preLoadRender', 'skipToNextTrack');

      this.nextTrack = this.collection.first();

      this.preLoadRender();

    },

    render: function() {
      var html = Mustache.to_html(this.template, this.nextTrack.toJSON());
      this.el.html(html);

      return this;
    },

    preLoadRender: function() {
      var html = this.preloadtemplate; // No need for mustache here since we have no variables
      this.el.html(html);
    },

    playpause: function() {
      soundManager.togglePause('track_'+this.nextTrack.id);
      $('#play, #pause').toggle();
      //TODO add css so that it lights up when playing...
      $(this.nextTrack.view.el).toggleClass('playing');
    },

    skipToNextTrack: function() {
      $(this.nextTrack.view.el).toggleClass('playing');
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)+1); // FIXME when at max, go to first
      soundManager.stopAll();
      soundManager.play('track_'+this.nextTrack.id);
      $(this.nextTrack.view.el).toggleClass('playing');
      this.render();
    },

    skipToPrevTrack: function() {
      $(this.nextTrack.view.el).toggleClass('playing');
      this.nextTrack = this.collection.at(this.collection.indexOf(this.nextTrack)-1);
      soundManager.stopAll();
      soundManager.play('track_'+this.nextTrack.id);
      $(this.nextTrack.view.el).toggleClass('playing');
      this.render();
    },

    restartTrack: function() {
      soundManager.stopAll();
      soundManager.play('track_'+this.nextTrack.id);
    }

  });

  var TracklistView = Backbone.View.extend({

    el: $('#tracklist'),

    events: {
      'click #add'                : 'showInput',
      'keypress #add-track-input' : 'addTrackOnEnter',
    },

    initialize: function() {
      _.bindAll(this, 'render', 'addTrackOnEnter', 'showInput');

      this.input = this.$('#add-track-input');
      this.collection = tracklist;
      this.collection.bind('add', this.appendTrack);

      var that = this;
      tracklist.fetch({
        success: function(model, response) {
          for (var track in tracklist.models) {
            that.appendTrack(tracklist.models[track]);
          }
          // FIXME should send in tracklist as collection, but async forces it to be global for the time being
          new PlayerView({ collection: tracklist });
        },
        error: function(model, response) {
          new Error('Something went wrong! This was the response: ' + response);
        }
      });

    },

    render: function() {
      return this;
    },

    appendTrack: function(track) {
      var view = new TrackView({ model: track });
      $('ol.tracks').append(view.render().el);
    },

    addTrackOnEnter: function(e) {
      //TODO add some validation on url
      if (e.keyCode != 13) return;
      var model = this.collection.create({
        url: this.input.val()
      });

      this.input.val('').fadeOut();
    },

    showInput: function() {
      this.input.fadeToggle();
    }

  });

  //FIXME Should not have to wait with loading app until soundmanager is ready, fix this
  soundManager.onready(function() {
    var Tracklist = new TracklistView();
  });

});

