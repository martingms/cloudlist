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
