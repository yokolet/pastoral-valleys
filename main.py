import json
import logging
import requests as rq
from flask import Flask, render_template, request


app = Flask(__name__)

APP_CONFIG = json.loads(open('app-config.json', 'r').read())

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

IMAGES = {
    'fire': 'fire.png',
    'action': 'action.png',
    'theft': 'thief.png',
    'gun': 'gun.png',
    'murder': 'skull.png',
    'sex': 'crying.png',
    }

def category(words):
    for listed in KEEP_LIST:
        if listed in words:
            return CATEGORIES[listed]
    return None

def extract(j_data):
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
            tmp['icon'] = '/image/' + IMAGES[cat]
            records.append(tmp)
    return records


@app.route('/api/JSON')
def getJSON():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    url = APP_CONFIG['opendata']['url']
    url = url + '$limit=' + str(APP_CONFIG['opendata']['limit'])
    url = url + '&$$app_token=' + APP_CONFIG['opendata']['app_token']
    # within_circle(field, lat, lng, radius)
    where_query = '&$where=within_circle(location, %s, %s, %s)' % (
        lat, lng, APP_CONFIG['opendata']['radius'])
    print(where_query)
    url += where_query
    response = rq.get(url)
    if response.status_code == 200:
        j_data = response.json()
        smaller_data = extract(j_data)
        return json.dumps(smaller_data)


@app.route('/')
def hello():
    return 'Hello World!';


@app.route('/marker-sample')
def markedMap():
    callback = 'initMap'
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    url = url + '&callback=' + callback
    return render_template('marker-sample.html', url=url)

@app.route('/soda-sample')
def sodaSample():
    callback = 'initSodaMap'
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    url = url + '&callback=' + callback
    return render_template('soda-sample.html', url=url)

@app.route('/ko-marker-sample')
def koMarkedMap():
    callback = 'initMap'
    url = APP_CONFIG['map']['url']
    url = url + 'key='+ APP_CONFIG['map']['api-key']
    return render_template('ko-marker-sample.html', url=url)

@app.errorhandler(500)
def server_error(e):
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
