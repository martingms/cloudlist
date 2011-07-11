from flask import Flask
import settings

app = Flask('cloudlist')
app.config.from_object('cloudlist.settings')

import views
