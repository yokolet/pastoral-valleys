import json
import logging
import requests as rq
from flask import Flask, render_template, request
import crimedata_builder as crime
import utils


app = Flask(__name__)


# Reads application config, which has API keys and
# SoQL parameters.
APP_CONFIG = json.loads(open('app-config.json', 'r').read())


# Reads location data manually created by areadata_builder.py
AREAS = json.loads(open('area-data.json', 'r').read())


@app.route('/api/JSON')
def getJSON():
    """API endpoint to return crime data.
    This method expects the request, /api/JSON?lat=xxx&lng=xxx ,
    and returns JSON data."""
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if lat and lng:
        data = crime.getCrimeData(lat, lng)
        if type(data) is list:
            return json.dumps(data)
        else:
            # data is a status code
            abort(data)
    else:
        # Bad Request
        abort(400)


@app.route('/api/location/JSON')
def getAreaCoord():
    """API endpoint to return location data"""
    return json.dumps(AREAS)


@app.route('/')
def koMarkedMap():
    """The neighborhood map application."""
    url = utils.APP_CONFIG['map']['url']
    url = url + 'key='+ utils.APP_CONFIG['map']['api-key']
    url += '&callback=initMap'
    buttons = [{'category': 'clear', 'image': '/static/image/uncheck_all.png', 'desc': 'Clear All'},
               {'category': 'all', 'image': '/static/image/check_all.png', 'desc': 'All'}]
    for cat in sorted(crime.DESC):
        buttons.append({'category': cat, 'image': crime.DESC[cat][0], 'desc': crime.DESC[cat][1]})
    safety_levels = [
        {'style': 'safety-level-all', 'title': 'All', 'level': 0},
        {'style': 'safety-level-good', 'title': 'Better', 'level': 1},
        {'style': 'safety-level-neutral', 'title': 'Average', 'level': 2},
        {'style': 'safety-level-bad', 'title': 'Worse', 'level': 3}
    ]
    return render_template('flask_map.html',
                           url=url, buttons=buttons,
                           safety_levels=safety_levels, locations=AREAS)


@app.errorhandler(500)
def server_error(e):
    """Error handling for 500 (Internal Error)"""
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
