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

def islisted(word):
    for listed in KEEP_LIST:
        if listed in word:
            return True
    return False

def extract(j_data):
    records = []
    for record in j_data:
        tmp = {}
        desc = record['lcr_desc'].lower().split('/')
        title = desc[0]
        if islisted(title) and 'location' in record:
            tmp['position'] = {'lat': record['location']['coordinates'][1],
                               'lng': record['location']['coordinates'][0]}
            tmp['title'] = title.capitalize()
            tmp['content'] = desc[1] if len(desc) > 1 else ''
            # tmp['image'] = ''
            records.append(tmp)
    return records


@app.route('/api/JSON')
def getJSON():
    url = APP_CONFIG['opendata']['url']
    url = url + '$$app_token=' + APP_CONFIG['opendata']['app_token']
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
