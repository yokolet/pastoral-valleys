import json
import logging
from flask import Flask, render_template, request


app = Flask(__name__)

MAP_CONFIG = json.loads(
    open('app-config.json', 'r').read())['map']

@app.route('/')
def hello():
    return 'Hello World!';

@app.route('/cat-clicker')
def catClicker():
    return render_template('cat-clicker.html')

@app.route('/marker-sample')
def markedMap():
    callback = 'initMap'
    url = MAP_CONFIG['url']
    url = url + 'key='+ MAP_CONFIG['api-key']
    url = url + '&callback=' + callback
    return render_template('marker-sample.html', url=url)

@app.route('/soda-sample')
def sodaSample():
    callback = 'initSodaMap'
    url = MAP_CONFIG['url']
    url = url + 'key='+ MAP_CONFIG['api-key']
    url = url + '&callback=' + callback
    return render_template('soda-sample.html', url=url)

@app.route('/ko-marker-sample')
def koMarkedMap():
    callback = 'initMap'
    url = MAP_CONFIG['url']
    url = url + 'key='+ MAP_CONFIG['api-key']
    return render_template('ko-marker-sample.html', url=url)

@app.errorhandler(500)
def server_error(e):
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
