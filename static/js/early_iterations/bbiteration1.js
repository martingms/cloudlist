// Main backbone app
//
$(function() {

  var Track = Backbone.Model.extend({
    defaults: {
      title: 'No title...',
      duration: '0:00', 
      source: 'soundcloud'
    }
  });

  var TrackList = Backbone.Collection.extend({
    model: Track,
    localStorage: new Store('tracks'),
  });

  var TrackView = Backbone.View.extend({
    tagName: 'li',

    template: $('#track-template').html(),

    events: {
      // TODO add remove event
      'dblclick span.title' : 'skipToClicked'
    },

    initialize: function() {
      _.bindAll(this, 'skipToClicked');
      //this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      $(this.el).addClass('track').html(Mustache.to_html(this.template, this.model.toJSON()));
      //this.setContent();
      return this;
    },

    skipToClicked: function() {
      return;
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.clear();
    }

  });

  var AppView = Backbone.View.extend({
    el: $('#main'),

    events: {
      'click .add' : 'showInput',
      'keypress #add-track-input' : 'addTrackOnEnter'
    },

    initialize: function() {
      _.bindAll(this, 'showInput', 'addTrackOnEnter');

      this.input = $('#add-track-input');

      this.collection = new TrackList();
      this.collection.bind('add', this.addTrack);

      //this.collection.fetch();
    },

    render: function() {
      return;
    },

    addTrackOnEnter: function(e) {
      if (e.keyCode != 13) return;
      this.collection.create({
        title: this.input.val(),
      });
      this.input.slideUp('fast');
      this.input.val('');
    },

    showInput: function() {
      this.input.slideDown('fast');
    }
  });

  var AppView = new AppView;

});
