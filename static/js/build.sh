#!/bin/bash

# Concatenating all non-lib javascript into one file

cat \
  app/intro.js \
  app/trackhandlers/mainhandler.js \
  app/trackhandlers/SoundcloudTrackHandler.js \
  app/trackhandlers/YouTubeTrackHandler.js \
  app/models/Track.js \
  app/models/Playlist.js \
  app/collections/PlaylistList.js \
  app/collections/TrackList.js \
  app/views/TrackView.js \
  app/views/PlayerView.js \
  app/views/TracklistView.js \
  app/outro.js \
  app/settings.js \
  app/utils.js \
  > app.js


# Using google closure compiler to reduce size.
# TODO Test with more optimization later on.
java -jar compiler.jar --compilation_level WHITESPACE_ONLY --js app.js --js_output_file app.min.js
