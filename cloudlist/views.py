from cloudlist import app
from flask import render_template, flash, redirect, url_for, jsonify, request
from google.appengine.ext import db

from models import Track
from forms import TrackForm

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tracks', methods = ['POST'])
def addtrack():
    trackurl = request.form['url']
    track = Track(url = db.Link(trackurl))
    track.put()
    return jsonify(url=trackurl)

@app.route('/tracks', methods = ['GET'])
def getalltracks():
    tracks = Track.all()
    response = [i.url for i in tracks]
    return jsonify(tracks=response)
