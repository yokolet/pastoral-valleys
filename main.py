import logging
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello World!';

@app.route('/cat-clicker')
def catClicker():
    return render_template('cat-clicker.html')

@app.errorhandler(500)
def server_error(e):
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
