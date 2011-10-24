from google.appengine.ext import db

class Track(db.Model):
    url = db.LinkProperty(required = True)

    def toDict(self):
        return { 'id': self.key().id(), 'url': self.url }

class Playlist(db.Model):
    name = db.StringProperty(required = True)
    tracks = db.ListProperty(db.Key)
