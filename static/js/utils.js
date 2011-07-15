//
// utils.js
//
// All kinds of utility functions not suited for inclusion in an app
// but needed none the less.


// Returns the hostname of an url. Only accepts ftp, http and https as protocols.
// Example:
// 'http://soundcloud.com/theglitchmob/daft-punk-derezzed-the-glitch'.getHostname();
// returns 'soundcloud.com'
String.prototype.getHostname = function() {
  var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
  return this.match(re)[1].toString();
}
