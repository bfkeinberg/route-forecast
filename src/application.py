import dateutil.tz
import json
import logging
import os
import os.path
import random
import requests
import string
import sys
import urllib2
from datetime import *
from flask import Flask, render_template, request, redirect, url_for, jsonify, g
from flask import current_app, safe_join
from flask_compress import Compress

from routeWeather import WeatherCalculator
from stravaActivity import StravaActivity

logger = logging.getLogger('RoutePlanner')
application = Flask(__name__,
                    root_path = os.path.abspath(
                        os.path.join(
                            os.path.dirname(
                                os.path.abspath(
                                    sys.modules.get(__name__).__file__)), '..')),
                    template_folder='dist', static_folder='dist/static',static_url_path='/static')
logger.info('Starting rando plan server')
Compress(application)
session = requests.Session()
strava_api_key = os.environ.get("STRAVA_API_KEY")
strava_activity = StravaActivity(strava_api_key, session)

def clear_globals():
    g.extension = None
    g.compressionType = None


def send_compressed_file(filename, formats=None):
    if formats is None:
        formats = [('br', '.br'), ('gzip', '.gz')]
    g.compressionType = None
    if not current_app.has_static_folder:
        raise RuntimeError('No static folder for the current application')
    accept_encoding = request.headers.get('Accept-Encoding', None)
    if not accept_encoding:
        return current_app.send_static_file(filename)
    encodings = [encoding.strip() for encoding in accept_encoding.split(',')]
    for enc_format, extension in formats:
        compressed = filename + extension
        if enc_format in encodings and os.path.exists(safe_join(current_app.static_folder, compressed)):
            g.compressionType = enc_format
            g.extension = os.path.splitext(filename)[1][1:]
            return current_app.send_static_file(compressed)
    return current_app.send_static_file(filename)


def setup_app():
    application.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
    application.view_functions['static'] = send_compressed_file
    application.before_request(clear_globals)
    secret_key = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(4))
    application.secret_key = secret_key
    application.weather_request_count = 0
    application.last_request_day = datetime.now().date()
    logging.basicConfig(level=logging.INFO)
    logging.getLogger('flask_cors').level = logging.DEBUG


@application.after_request
def add_header(r):

    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    if hasattr(g, 'compressionType') and g.compressionType is not None:
        r.headers['Content-Encoding'] = g.compressionType
    if hasattr(g,'extension'):
        if g.extension == 'js':
            r.content_type = 'text/javascript'
        if g.extension == 'css':
            r.content_type = 'text/css'
    return r


@application.context_processor
def inject_api_keys():
    return dict(maps_key=os.getenv('MAPS_KEY', 'NONE'),
                darksky_api_key=os.getenv('DARKSKY_API_KEY', 'NONE'),
                rwgps_api_key=os.getenv('RWGPS_API_KEY', 'NONE'),
                timezone_api_key=os.getenv('TIMEZONE_API_KEY', 'NONE'))


@application.route('/')
def hello():
    return render_template('index.html')


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
        return 'An internal error occurred.' + e.message, 500   # e.response.status_code


@application.route('/form')
def form():
    return render_template('index.html', disabled='disabled style=' + "'color:#888;'")


@application.route('/stravaAuthReq')
def authenticate_with_strava():
    logger.info('Authenticating with Strava')
    state = request.args.get('state')
    if state is None:
        return jsonify({'status': 'Missing keys'}), 400
    return strava_activity.authenticate(request.host_url, state)


@application.route('/stravaAuthReply')
def handle_strava_auth_response():
    code = request.args.get('code')
    error = request.args.get('error')
    state = request.args.get('state')
    if state is not None:
        restored_state = json.loads(state)
    else:
        restored_state = {}
    if error is not None:
            logger.info('Strava authentication error %s', error)
    token = strava_activity.get_token(code)
    restored_state['strava_token'] = token
    restored_state['strava_error'] = error
    url = url_for('form', **restored_state)

    return redirect(url)


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
        return jsonify({'status': 'Missing keys'}), 400
    logger.info('Request from %s(%s) for rwgps route %s',
                request.remote_addr, request.headers.get('X-Forwarded-For', request.remote_addr), route)
    is_trip = request.args.get('trip')
    if is_trip is None or is_trip != 'true':
        route_type = 'routes'
    else:
        route_type = 'trips'
    rwgps_api_key = os.environ.get("RWGPS_API_KEY")
    if rwgps_api_key is None:
        return jsonify({'status': 'Missing rwgps API key'}), 500
    route_info_result = session.get("https://ridewithgps.com/{1}/{0}.json".format(route, route_type),
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
    return jsonify({'loggedIn': True, 'auth_token': userinfo['user'].auth_token})


@application.route('/forecast', methods=['POST'])
def forecast():
    if not request.form.keys() >= ['locations', 'timezone']:
        return jsonify({'status': 'Missing keys'}), 400
    try:
        forecast_points = json.loads(request.form['locations'])
    except ValueError as error:
        return jsonify({'status': 'Badly formatted forecast locations :' + str(error)}), 400
    logger.info('Request from %s(%s) for %d forecast points', request.remote_addr,
                request.headers.get('X-Forwarded-For', request.remote_addr), len(forecast_points))
    if len(forecast_points) > 50:
        return jsonify({'status': 'Invalid request, increase interval'}), 400
    today = datetime.now().date()
    if today != application.last_request_day:
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
        results.append(wcalc.call_weather_service(point['lat'], point['lon'], point['time'], point['distance'], req_tzinfo,
                                                  point['bearing']))
    return jsonify({'forecast': results})


# run the app.
setup_app()
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    # application.run(threaded=True,host='0.0.0.0')
    application.run(threaded=True)
