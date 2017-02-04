import json
import utils

# Description dictionary for markers
DESC = {
    'fire': ['/static/image/fire.png', 'Arson'],
    'action': ['/static/image/action.png', 'Assult'],
    'theft': ['/static/image/thief.png', 'Burglary, Larceny, Robbery, Theft'],
    'gun': ['/static/image/gun.png', 'Firearms, Shots fired, Weapons'],
    'murder': ['/static/image/skull.png', 'Homicide, Murder'],
    'sex': ['/static/image/angry.png', 'Sex offense, Rape'],
    }


def createCrimeData(result, record, title, cat):
    """Given original data from OpenData, cleans up and narrows down
    to relevant records."""
    tmp = {}
    tmp['position'] = {'lat': record['location']['coordinates'][1],
                       'lng': record['location']['coordinates'][0]}
    tmp['title'] = title.capitalize()
    tmp['content'] = '%s<br/>%s' % (
        record['lcr_desc'].capitalize(),
        str(record['inc_datetime']).capitalize())
    tmp['category'] = cat
    tmp['icon'] = DESC[cat][0]
    result.append(tmp)


def getCrimeData(lat, lng):
    """API endpoint to return crime data.
    This method expects the request, /api/JSON?lat=xxx&lng=xxx ,
    and returns JSON data."""
    return utils.getExtracted(createCrimeData, lat, lng)
