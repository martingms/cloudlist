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
          }(),
          shorttitle : function() {
            if (scdata.title.length > 50) {
              return scdata.title.slice(0,47)+'...';
            } else {
              return scdata.title;
            }
          }()
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

    events: {},

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
      var tracklist = new TrackList();
      this.collection = tracklist;
      this.collection.bind('add', this.appendTrack);

      var that = this;
      tracklist.fetch({
        success: function(model, response) {
          for (var track in tracklist.models) {
            that.appendTrack(tracklist.models[track]);
          }
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

  var App = new TracklistView();

});

