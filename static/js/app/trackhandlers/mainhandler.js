// mainhandler.js

function newTrackHandler(track) {
  var host = track.get('url').getHostname();

  // Chooses which function to use for fetching track info based on link hostname.
  switch (host) {
    case 'soundcloud.com':
      soundcloudTrackHandler(track);
      break;
    case 'youtube.com', 'www.youtube.com':
      //this.set({ ytid: this.get('url').getYtVideoId() });
      youTubeTrackHandler(track);
      break;
    default:
      console.log("This source (" + track.get('url') + ") is not yet supported.");
  }
};
