import json
import requests as rq

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


def category(words):
    """Given words (title), returns its category"""
    for listed in KEEP_LIST:
        if listed in words:
            return CATEGORIES[listed]
    return None


def extract(f, result, j_data):
    """Given original data from OpenData, cleans up and narrows down
    to relevant records. Returns a count of relevant records."""
    for record in j_data:
        tmp = {}
        desc = record['lcr_desc'].lower().split('/')
        title = desc[0]
        cat = category(title)
        if cat and 'location' in record:
            f(result, record, title, cat)
    return result


def getExtracted(f, lat, lng):
    """API endpoint to return crime data.
    This method expects the request, /api/JSON?lat=xxx&lng=xxx ,
    and returns JSON data."""
    url = APP_CONFIG['opendata']['url']
    url = url + '$limit=' + str(APP_CONFIG['opendata']['limit'])
    url = url + '&$$app_token=' + APP_CONFIG['opendata']['app_token']
    # SoQL query: within_circle(field, lat, lng, radius)
    where_query = '&$where=within_circle(location, %s, %s, %s)' % (
        lat, lng, APP_CONFIG['opendata']['radius'])
    url += where_query
    response = rq.get(url)
    result = []
    if response.status_code == 200:
        j_data = response.json()
        return extract(f, result, j_data)
    else:
        return response.status_code

