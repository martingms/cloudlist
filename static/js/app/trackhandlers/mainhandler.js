// mainhandler.js

function newTrackHandler(url) {
  var host = url.getHostname();

  // Chooses which function to use for fetching track info based on link hostname.
  switch (host) {
    case 'soundcloud.com':
      return new SoundcloudTrackHandler(url);
      break;
    case 'youtube.com', 'www.youtube.com':
      //this.set({ ytid: this.get('url').getYtVideoId() });
      return new YouTubeTrackHandler(url);
      break;
    default:
      console.log("This source (" + url + ") is not yet supported.");
  }
};
