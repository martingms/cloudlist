import logging

from flask import render_template, flash, redirect, url_for, jsonify, request, json

from google.appengine.ext import db

from cloudlist import app
from models import Track, Playlist

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ajax/tracks', methods = ['GET'])
def gettracks():
    tracks = Track.all()
    response = []

    for track in tracks:
        response.append(track.toDict())

    return json.dumps(response)

@app.route('/ajax/tracks', methods = ['POST'])
def addtrack():
    trackurl = request.json['url']
    track = Track(url = db.Link(trackurl))
    track.put()

    #TODO Add track to correct playlist

    return jsonify(id = track.key().id(), url=trackurl)

@app.route('/playlist', methods = ['GET'])
def getalltracks():
    playlists = Playlist.all()

    response = {}

    for playlist in playlists:
        pl = {}
        tracks = {}
        i = 1
        for track in playlist.tracks:
            trackobj = Track.get(track)
            tracks[i] = {'url':trackobj.url, 'type':'sc'} #FIXME 'sc' for now, change to track.type
            i += 1
        pl['tracks'] = tracks
        response[playlist.name] = pl

    return jsonify(response)

#@app.route('/playlist/G')
def x():
    playlist = Playlist.all().filter('name =', 'Godlista').get()
    trackkeys = [i.key() for i in Track.all()]
    playlist.tracks = trackkeys
    playlist.put()
    return str(playlist.tracks)





