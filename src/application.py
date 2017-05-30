import json
import logging
import os
import random
import string
import tempfile
from datetime import *
import dateutil.tz
import urllib2

import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify
# from flask import flash
from flask_bower import Bower

from routeWeather import WeatherCalculator

application = Flask(__name__)
application.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
secret_key = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(4))
application.secret_key = secret_key
logged_into_rwgps = False
Bower(application)
session = requests.Session()
application.weather_request_count = 0
application.last_request_day = datetime.now().date()
logger = logging.getLogger('RoutePlanner')

@application.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return r


@application.context_processor
def inject_api_keys():
    return dict(maps_key=os.getenv('MAPS_KEY', 'NONE'),
                darksky_api_key=os.getenv('DARKSKY_API_KEY', 'NONE'),
                rwgps_api_key=os.getenv('RWGPS_API_KEY', 'NONE'))


@application.route('/')
def hello():
    return render_template('form.html')


@application.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    print type(e)
    if type(e) != urllib2.HTTPError:
        if type(e.message) == str:
            return 'An internal error occurred.' + e.message
        else:
            return e.message
    else:
        return 'An internal error occurred.' + e.message, 500 #e.response.status_code


@application.route('/form')
def form():
    return render_template('form.html', disabled='disabled style=' + "'color:#888;'")


def dl_from_rwgps(route_number):
    gpx_url = "https://ridewithgps.com/routes/{}.gpx?sub_format=track".format(route_number)
    dl_req = session.get(gpx_url)
    return dl_req.content


@application.route("/rwgps_login", methods=['GET'])
def log_in_to_rwgps():
    return render_template('login_form.html', service='Ride with GPS')


@application.route('/rwgps_route', methods=['GET'])
def get_rwgps_route():
    route = request.args.get('route')
    if route is None:
        return jsonify({'status':'Missing keys'}), 400
    isTrip = request.args.get('trip')
    if isTrip is None or isTrip != 'true':
        routeType = 'routes'
    else:
        routeType = 'trips'
    rwgps_api_key = os.environ.get("RWGPS_API_KEY")
    if rwgps_api_key is None:
        return jsonify({'status': 'Missing rwgps API key'}), 500
    route_info_result = session.get("https://ridewithgps.com/{1}/{0}.json".format(route,routeType),
                               params={'apikey': rwgps_api_key})
    if route_info_result.status_code != 200:
        return jsonify({'status': route_info_result.text}), route_info_result.status_code
    return jsonify(route_info_result.json())

@application.route('/handle_login', methods=['POST'])
def handle_login():
    if 'username' not in request.form or 'password' not in request.form:
        return jsonify({'loggedIn': False, 'status': 'Missing rwgps username or password'}), 402

    username = request.form['username']
    password = request.form['password']
    rwgps_api_key = os.environ.get("RWGPS_API_KEY")
    if rwgps_api_key is None:
        return jsonify({'loggedIn': False, 'status': 'Missing rwgps API key'}), 500

    login_result = session.get("https://ridewithgps.com/users/current.json",
                               params={'email': username, 'password': password, 'apikey': rwgps_api_key})
    if login_result.status_code == 401:
        return jsonify({'loggedIn': False, 'status': 'Invalid rwgps login'}), login_result.status_code
    login_result.raise_for_status()
    userinfo = login_result.json()
    if userinfo["user"] is None:
        return jsonify({'loggedIn': False, 'status': 'Invalid rwgps user'}), 401
    return jsonify({'loggedIn': True})


@application.route('/submitted', methods=['POST'])
def submitted_form():
    if not request.form.viewkeys() >= {'interval', 'pace', 'starting_time', 'timezone'}:
        return jsonify({'status': 'Missing keys'}), 400
    interval = request.form['interval']
    starting_time = request.form['starting_time']
    timezone = request.form['timezone']
    pace = request.form['pace']
    if 'controls' in request.form:
        controls = json.loads(request.form['controls'])
    else:
        controls = []
    files = request.files
    route = files['route']
    if len(route.filename) > 0:
        contents = route.read()
    elif request.form['ridewithgps'] != "":
        route_number = request.form['ridewithgps']
        gpx_url = "https://ridewithgps.com/trips/{}.gpx?sub_format=track".format(route_number)
        dl_req = session.get(gpx_url)
        if dl_req.status_code == 200:
            contents = dl_req.content      #  dl_from_rwgps(route_number)
        else:
            return jsonify({'status': dl_req.reason}), dl_req.status_code
    else:
        return jsonify({'status': 'No route provided'}), 400
    with tempfile.NamedTemporaryFile(mode='w+') as local_file:
        local_file.write(contents)
        local_file.flush()
        wcalc = WeatherCalculator(session)
        try:
            forecast = wcalc.calc_weather(float(interval), pace, starting_time=starting_time, tz=timezone,
                                          route=local_file.name, controls=controls)
        except requests.HTTPError as excpt:
            return jsonify({'status': excpt.message}), 500
        except Exception as excpt:
            return jsonify({'status': excpt.message}), 500
        if wcalc.is_error():
            return jsonify({'status': forecast}), 400
        bounds = wcalc.get_bounds()
        min_lat, min_lon, max_lat, max_lon = bounds
    return jsonify({'forecast': forecast, 'min_lat': min_lat, 'max_lat': max_lat, 'min_lon': min_lon,
                    'max_lon': max_lon, 'points': wcalc.get_points(), 'name': wcalc.get_name(),
                                'controls': wcalc.get_controls()})

@application.route('/forecast',methods=['POST'])
def forecast():
    if not request.form.viewkeys() >= {'locations', 'timezone'}:
        return jsonify({'status':'Missing keys'}), 400
    forecast_points = json.loads(request.form['locations'])
    if len(forecast_points) > 40:
        return jsonify({'status':'Invalid request'}),400
    today = datetime.now().date()
    if (today != application.last_request_day):
        application.last_request_day = today
        application.weather_request_count = len(forecast_points)
    elif len(forecast_points) + application.weather_request_count > 900:
        return jsonify({'status': 'Daily count exceeded'}), 400
    else:
        application.weather_request_count += len(forecast_points)
    wcalc = WeatherCalculator(session)
    zone = request.form['timezone']
    req_tzinfo = dateutil.tz.tzoffset('local', long(zone))
    # logger.info("Zone: %d Zone info : %s offset:%s", long(zone), req_tzinfo, req_tzinfo.utcoffset(10))
    results = []
    for point in forecast_points:
        # want to correct each time point with this timezone offset
        # first get the original time
        # uncorrected_time = datetime.fromtimestamp(point['time'],req_tzinfo)
        # corrected_time = datetime(uncorrected_time.year,uncorrected_time.month,uncorrected_time.day,uncorrected_time.hour,
        #                           uncorrected_time.minute,0,0,req_tzinfo)
        # logger.info("Uncorrected time:%s corrected time:%s", uncorrected_time, corrected_time)
        # offset_time = corrected_time.strftime('%Y-%m-%dT%H:%M:%S%z')
        # logger.info("full time %s",offset_time)
        # logger.info("received message time:%s",point['time'])
        results.append(wcalc.call_weather_service(point['lat'],point['lon'],point['time'],point['distance'],req_tzinfo,
                                                  point['bearing']))
    return jsonify({'forecast':results})

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    # application.debug = True
    application.run(threaded=True)
