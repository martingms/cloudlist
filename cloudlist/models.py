from google.appengine.ext import db

class Track(db.Model):
    title = db.StringProperty(required = True)
    uploader = db.StringProperty()
    added = db.DateTimeProperty(auto_now_add = True)
    link = db.LinkProperty(required = True)
