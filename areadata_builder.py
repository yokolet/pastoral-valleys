import json
import utils

# Location list
AREAS = [
    {'name': 'Brier Creek',
     'lat': 35.912697,
     'lng': -78.781792},
    {'name': 'Cameron Village',
     'lat': 35.789403,
     'lng': -78.663048},
    {'name': 'Capital Blvd',
     'lat': 35.835070,
     'lng': -78.582510},
    {'name': 'Crabtree Pines',
     'lat': 35.862744,
     'lng': -78.711886},
    {'name': 'Downtown',
     'lat': 35.778315,
     'lng': -78.640196},
    {'name': 'East Raleigh',
     'lat': 35.787916,
     'lng': -78.587820},
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
    {'name': 'Royal Pines',
     'lat': 35.769797,
     'lng': -78.614418},
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


def count_extracted(j_data):
    """Given original data from OpenData, cleans up and narrows down
    to relevant records. Returns a count of relevant records."""
    count = 0
    for record in j_data:
        tmp = {}
        desc = record['lcr_desc'].lower().split('/')
        title = desc[0]
        cat = category(title)
        if cat and 'location' in record:
            count += 1
    return count


def countCrimes(result, record, title, cat):
    if len(result) == 0:
        result.append(1)
    else:
        result[0] += 1

def getCounts():
    """API endpoint to return crime data.
    This method expects the request, /api/JSON?lat=xxx&lng=xxx ,
    and returns JSON data."""
    for area in AREAS:
        print(area['name'])
        lat = area['lat']
        lng = area['lng']
        count = utils.getExtracted(countCrimes, lat, lng)
        print('count: %s' % count)
        if type(count) is list:
            area['count'] = count[0]
    return AREAS


def createData():
    areaData = getCounts()
    areas = sorted(areaData, key=lambda x: x['count'])
    chunk_size = len(areas) / 3
    level = 0
    for index, area in enumerate(areas):
        if index % chunk_size == 0:
            level += 1
        area['safelevel'] = level
        area['id'] = area['name'].replace(" ", "").lower()
    areas = sorted(areas, key=lambda x: x['name'])
    f = open('area-data.json', 'w')
    json.dump(areas, f)
    f.close()

createData()
