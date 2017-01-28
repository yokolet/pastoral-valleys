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

ZIPCODES = [
    27601, 27603, 27604, 27605, 27606, 27607, 27608, 27609,
    27610, 27612, 27613, 27614, 27615, 27616, 27617
    ]


GEO_ENDPOINT = APP_CONFIG['geo']['url'] + 'key=' + APP_CONFIG['geo']['api-key']


def queryZipcode(zipcode):
    area = {'zipcode': zipcode}
    address = '&address=%s' % zipcode
    url = GEO_ENDPOINT + address
    response = rq.get(url)
    print(url)
    print(response)
    if response.status_code == 200:
      if 'results' in response.json() and len(response.json()) > 0:
          location = response.json()['results'][0]['geometry']['location']
          area['lat'] = location['lat']
          area['lng'] = location['lng']
    return area


LOCATIONS = [queryZipcode(zipcode) for zipcode in ZIPCODES]


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
    response = rq.get(url)
    if response.status_code == 200:
        j_data = response.json()
        smaller_data = extract(j_data)
        return json.dumps(smaller_data)


@app.route('/api/zipcode/JSON')
def getZipCoord():
    return json.dumps(LOCATIONS)


@app.route('/')
def koMarkedMap():
    """The neighborhood map application."""
    callback = 'initMap'
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    buttons = [{'category': 'all', 'image': '/image/check_all.png', 'desc': 'All'}]
    for cat in sorted(DESC):
        buttons.append({'category': cat, 'image': DESC[cat][0], 'desc': DESC[cat][1]})
    return render_template('ko-map.html', url=url, buttons=buttons, areas=AREAS)


@app.route('/heatmap-sample')
def headSample():
    return render_template('heatmap-sample.html')

@app.route('/another-map')
def anotherMap():
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    return render_template('another-map.html', url=url, locations=LOCATIONS)


@app.errorhandler(500)
def server_error(e):
    """Error handling for 500 (Internal Error)"""
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
