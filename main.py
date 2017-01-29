import json
import logging
import requests as rq
from flask import Flask, render_template, request


app = Flask(__name__)

# Reads application config, which has API keys and
# SoQL parameters.
APP_CONFIG = json.loads(open('app-config.json', 'r').read())


# If title includes the words in this list,
# the record will be used.
# Original data has more than 400 different titles.
KEEP_LIST = [
    'arson',
    'assault',
    'burglary',
    'firearm',
    'homicide',
    'larceny',
    'murder',
    'rape',
    'robbery',
    'sex',
    'shots',
    'theft',
    'weapons'
    ]


# Further, narrows down to six categories
CATEGORIES = {
    'arson': 'fire',
    'assault': 'action',
    'burglary': 'theft',
    'firearm': 'gun',
    'homicide': 'murder',
    'larceny': 'theft',
    'murder': 'murder',
    'rape': 'sex',
    'robbery': 'theft',
    'sex': 'sex',
    'shots': 'gun',
    'theft': 'theft',
    'weapons': 'gun',
    }


# Description dictionary for markers
DESC = {
    'fire': ['/image/fire.png', 'Arson'],
    'action': ['/image/action.png', 'Assult'],
    'theft': ['/image/thief.png', 'Burglary, Larceny, Robbery, Theft'],
    'gun': ['/image/gun.png', 'Firearms, Shots fired, Weapons'],
    'murder': ['/image/skull.png', 'Homicide, Murder'],
    'sex': ['/image/angry.png', 'Sex offense, Rape'],
    }

# Location list
AREAS = [
    {'name': 'Brier Creek',
     'lat': 35.912697,
     'lng': -78.781792},
    {'name': 'Cameron Village',
     'lat': 35.789403,
     'lng': -78.663048},
    {'name': 'Crabtree Pines',
     'lat': 35.862744,
     'lng': -78.711886},
    {'name': 'Downtown',
     'lat': 35.778315,
     'lng': -78.640196},
    {'name': 'Laurel Hills',
     'lat': 35.833097,
     'lng': -78.698538},
    {'name': 'Mordecai',
     'lat': 35.797566,
     'lng': -78.629338},
    {'name': 'Northeast Raleigh',
     'lat': 35.867382,
     'lng': -78.563709},
    {'name': 'North Hills',
     'lat': 35.834982,
     'lng': -78.638971},
    {'name': 'North Raleigh',
     'lat': 35.879601,
     'lng': -78.625057},
    {'name': 'Six Forks North',
     'lat': 35.900966,
     'lng': -78.652319},
    {'name': 'Six Forks South',
     'lat': 35.819788,
     'lng': -78.623952},
    {'name': 'Southwest Raleigh',
     'lat': 35.768438,
     'lng': -78.694160},
    {'name': 'Stonehenge',
     'lat': 35.882922,
     'lng': -78.679141},
    {'name': 'Umstead',
     'lat': 35.890672,
     'lng': -78.750061},
    {'name': 'Wade',
     'lat': 35.809230,
     'lng': -78.734234}
    ]

def category(words):
    """Given words (title), returns its category"""
    for listed in KEEP_LIST:
        if listed in words:
            return CATEGORIES[listed]
    return None


def extract(j_data):
    """Given original data from OpenData, cleans up and narrows down
    to relevant records."""
    records = []
    for record in j_data:
        tmp = {}
        desc = record['lcr_desc'].lower().split('/')
        title = desc[0]
        cat = category(title)
        if cat and 'location' in record:
            tmp['position'] = {'lat': record['location']['coordinates'][1],
                               'lng': record['location']['coordinates'][0]}
            tmp['title'] = title.capitalize()
            tmp['content'] = '%s<br/>%s' % (
                record['lcr_desc'].capitalize(),
                str(record['inc_datetime']).capitalize())
            tmp['category'] = cat
            tmp['icon'] = DESC[cat][0]
            records.append(tmp)
    return records


@app.route('/api/JSON')
def getJSON():
    """API endpoint to JavaScript client.
    This method expects the request, /api/JSON?lat=xxx&lng=xxx ,
    and returns JSON data."""
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    url = APP_CONFIG['opendata']['url']
    url = url + '$limit=' + str(APP_CONFIG['opendata']['limit'])
    url = url + '&$$app_token=' + APP_CONFIG['opendata']['app_token']
    # SoQL query: within_circle(field, lat, lng, radius)
    where_query = '&$where=within_circle(location, %s, %s, %s)' % (
        lat, lng, APP_CONFIG['opendata']['radius'])
    print(where_query)
    url += where_query
    print(url)
    response = rq.get(url)
    print("status_code: " + str(response.status_code))
    if response.status_code == 200:
        j_data = response.json()
        smaller_data = extract(j_data)
        return json.dumps(smaller_data)
    else:
        return response.raise_for_status()


@app.route('/api/location/JSON')
def getAreaCoord():
    return json.dumps(AREAS)


@app.route('/')
def koMarkedMap():
    """The neighborhood map application."""
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    buttons = [{'category': 'all', 'image': '/image/check_all.png', 'desc': 'All'}]
    for cat in sorted(DESC):
        buttons.append({'category': cat, 'image': DESC[cat][0], 'desc': DESC[cat][1]})
    return render_template('ko-map.html', url=url, buttons=buttons, locations=AREAS)


@app.errorhandler(500)
def server_error(e):
    """Error handling for 500 (Internal Error)"""
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
