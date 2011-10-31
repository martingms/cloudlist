// TracklistView.js


// The view for the whole tracklist. Renders one _collection of tracks_.
var TracklistView = Backbone.View.extend({

  el: $('#tracklist'),

  events: {
    'click #add'                : 'showInput',
    'keypress #add-track-input' : 'addTrackOnEnter'
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
