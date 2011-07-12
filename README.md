## TODO

 * Lists are currently randomized, depending on how fast they are
   loaded. Add number-in-playlist to songs and add them depending on
   where they are in line.
 * Add possibility to make new playlists
 * Fix playback. Doubleclicking a song plays it, also add "playing"
   class to the song in list playing and highlight it somehow.
 * Clean up all code, maybe drop flask for such a simple app? Atleast
   clean up the javascript so it is readable etc.
 * Wire up the previous and next buttons, and make the progressbar work.
 * Add a small margin-left to playlistname, to line up with trackname.

## Straight up bugs

 * Soundmanager trackids ends up being just 'track\_'.
 * text in input fields has wrong css.
 * URL-input doesnt close after successful add.
