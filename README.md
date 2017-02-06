# Neighborhood Map - Raleigh, NC

## Motivation

When I find my apartment to live next, I consider many factors: a rent, layout, facility,
walkscore and safety. Among them, the safety is very important. I often visit local news
media websites and check incidents. Luckily, my city, Raleigh, NC is a safe place, so I
don't see many crime reports on the news sites. However, I hear small incidents once
in a while in my neighborhood. So, I decided to explore past crime reports published by City of Raleigh.
The data is from
[City of Raleigh, Public Safefy](https://data.raleighnc.gov/category/public-safety).

When I firstly saw my app rendered crime icons on the map, I thought my app had a bug
or such. That's because I saw really many, so many, icons on the map. Soon, I
figured out those were correct from the description and date. Probably, 90% of those
don't bother individuals unless they become a victim. Suppose something was stolen from my car
while parking. That would hurt me seriously, but a very small incident to majority.
Apparently, the incident won't deserve to be a news even on the local media.

The data includes the report since 2005. As the data shows, during 10 years, almost
everywhere had some sort of crimes. The difference is some areas have more,
while others have less. It is a good information to choose the area for an apartment
hunting.


## Application site

The website is up and running at <https://pastoral-valleys-1484764452484.appspot.com/> .
Alternatively, the shortened url [`goo.gl/gFy5tQ`](https://goo.gl/gFy5tQ) works as well.


## About Data

The data fields are explained in the document, [Police Crime Incident Data from Jan 1 2005 - Present - Master (Summary UCR)](https://dev.socrata.com/foundry/data.raleighnc.gov/emea-ai2t).
The data include long range of records, more than 10 years. Probably, the system versions have changed over
this time. Many inconsistent records are shown in the data set.
For example, the `lcr` (Local crime reporting code) field is letters only,
or mixture of number and letters. In total, there are more than 400 types.
If I look at `lcr` values assigned to *assault* using a simple Python code, those are:

```
assault: Set(['E', '25B', '25C', '25A', '25F', '25G', '25D', '25E', 'A44', '2', '5', 'A43', 'A45', 'A41', 'A42'])]
```

The `lcr_desc` field is more helpful to categories the record compared to 'lcr'.
However, still it's not easy to use as those are.
This field has a format `category/descrition`. If I look at the category part,
those are like this:

```
Assault
ASSAULT
"ASSAULT
ASSAULT WITH FIREARM
ASSAULT WITH OTHER DANGEROUS WEAPON
```

After changing all to lower case, I still see more than 100 types.


Because of this nature, it's not a good idea to process data on JavaScript to make markers.
On this app, the pre-processing is done in the server side.
The server makes query to OpenData API endpoint. The relevant records are extracted and
converted to smaller JSON, which makes JavaScript work less.

The definition of relevant data is the crime records that may affect my apartment hunting.
If the category part of `lcr_desc` field includes one of the following words, the record
is used to plot marker. Otherwise, it will be dropped from JSON data to send out to
JavaScript client.

```
'arson', 'assault', 'burglary', 'firearm', 'homicide', 'larceny',
'murder', 'rape', 'robbery', 'sex', 'shots', 'theft', 'weapons'
```


## System design

This app consists of server side and client side apps.
The server uses [Flask](http://flask.pocoo.org/) framework.
The client uses [Knockout](http://knockoutjs.com/index.html) as a MVVM framework.


The client makes an Ajax request to Flask app API endpoint.
Flask app makes an request to the OpenData API endpoint and returns JSON to Knockout app
after pre-processing data.
The Knockout app renders Google map and markers based on the data back from Flask app.



# How to run locally

## Python version

This app runs on Python version 2. Check the version by the command:

```
python -V
```

## Google App Engine SDK

The code includes both server side and client side. The sever runs on
Google App Engine. To run the server, install `google-cloud-sdk`.
See <https://cloud.google.com/sdk/docs/> for details about SDK.

## Python packages

Flask is used for the server side framework. To make a request to the OpenData API endpoint,
it uses the requests package. The requests package should be exactly the version 2.3.0 .
This is the only version the requests module works as expected on Google App Engine.


```
pip install --target lib Flask==0.12
pip install --target lib requests==2.3.0
```

## Start server

On the shell, on which path to Google App Engine SDK is set,

```
$ dev_appserver.py app.yaml
INFO     2017-01-23 18:37:48,475 devappserver2.py:764] Skipping SDK update check.
INFO     2017-01-23 18:37:48,920 api_server.py:268] Starting API server at: http://localhost:51794
INFO     2017-01-23 18:37:48,924 dispatcher.py:199] Starting module "default" running at: http://localhost:8080
INFO     2017-01-23 18:37:48,956 admin_server.py:116] Starting admin server at: http://localhost:8000
```

As the message shows, the server is running on port 8080.



## Open the client app

On the web browser, open the url:

```
http://localhost:8080
```


# How to use


The app has features described below:

1. show information

    When the info icon on upper right corner, ![info](static/image/Info.png),
    Data source link and instruction will show up.

2. choose an area

    A list of areas shows up when hamburger icon on the top left gets clicked.
    Move the mouse cursor on the area name. Markers on the map open up an info
    window.

    Alternatively, moving the mouse cursor to the markers on the map also
    opens the info window.

3. filter areas

    A Safety Filter button shows up when hamburger icon on the top left gets clicked.
    Each area has a safety level based on the number of crimes in the area.
    - white: all
    - green: better
    - yellow: average
    - red: worse

4. show crimes

    When the markers on the map are clicked, the app makes query to the server
    and renders crime markers on the map.
    On the backend, the Flask server makes a query to City of Raleigh Open Data API.

5. filter crimes by category

    Once crime data is loaded and crime markers are put on the map, Crime Filter
    button turns to available to click. Choose one of them to filter crime
    category.
    Also, clearing all crime icons up from map is available.

6. show details of each crime

    Each crime marker is clickable. When the marker is clicked,
    it shows the details of the crime.


# Files

- `README.md`: this file
- `app.yaml`: Google App Engine web app config file
- `appengine-config.py`: Google App Engine library loading config file
- `app-config.json`: API keys and OpenData search options
- `area-data.json`: Manually (offline) created area (location) data
- `areadata_builder.py`: Offline app to create area-data.json
- `crimedata-builder.py`: Function to create crime data for JavaScript client/
- `main.py`: Flask app
- `utils.py`: Utilities to connect Open Data API
- `requirements.txt`: Python packages installation info
- `static/css`: a directory for CSS files
- `static/image`: a directory for image files
- `static/js`: a directory for JavaScript files
- `templates`: a directory for Jinja2 template files



### Credit to icons

- Thief
    <http://www.flaticon.com/authors/nikita-golubev>
- Action
    <https://icons8.com/web-app/11810/action>
- Firing Gun
    <https://icons8.com/web-app/17901/firing-gun>
- Angry
    <https://icons8.com/web-app/13710/angry>
- Fire Element
    <https://icons8.com/web-app/18515/fire-element>
- Thriller
    <https://icons8.com/web-app/13034/thriller>
- Check All
    <https://icons8.com/web-app/24522/check-all>
- Uncheck All
    <https://icons8.com/web-app/35041/uncheck-all>
- Info
    <https://icons8.com/web-app/12253/info>
