from flaskext import wtf
from flaskext.wtf import validators

class TrackForm(wtf.Form):
    title = wtf.TextField('Title')
    link = wtf.TextField('TrackURL', validators=[validators.required()])
