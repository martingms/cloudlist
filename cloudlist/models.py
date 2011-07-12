from google.appengine.ext import db

class Track(db.Model):
    url = db.LinkProperty(required = True)
