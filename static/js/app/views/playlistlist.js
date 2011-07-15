//
//
//
//

App.Views.PlaylistList = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  render: function() {
    var template = $('#playlistlist-template');

    $(this.el).html(Mustache.to_html(template, this.collection));
    $('#tracklist').html(this.el);
  }
});
