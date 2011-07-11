from cloudlist import app
from flask import render_template, flash, redirect, url_for
from google.appengine.ext import db

from models import Track
from forms import TrackForm

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tracks')
def tracks():
    tracks = Track.all()
    return render_template('tracklist.html', tracks = tracks)

@app.route('/tracks/add', methods = ['GET', 'POST'])
def addtrack():
    form = TrackForm()
    if form.validate_on_submit():
        track = Track(title = 'test',
                      link = db.Link(form.link.data))
        track.put()
        flash('Track saved!')
        return redirect(url_for('tracks'))
    return render_template('new_track.html', form=form)
