import json
import logging
import os
import random
import string
import tempfile

import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify
# from flask import flash
from flask_bower import Bower

from routeWeather import weather_calculator

application = Flask(__name__)
application.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
secret_key = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(4))
application.secret_key = secret_key
logged_into_rwgps = False
Bower(application)
session = requests.Session()

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
    return dict(maps_key=os.getenv('MAPS_KEY','NONE'),
                darksky_api_key=os.getenv('DARKSKY_API_KEY','NONE'),
                rwgps_api_key=os.getenv('RWGPS_API_KEY','NONE'))

@application.route('/')
def hello():
    return redirect(url_for('form'))

@application.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500

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

@application.route('/handle_login', methods=['POST'])
def handle_login():
    if not 'username' in request.form or not 'password' in request.form:
        return jsonify({'loggedIn': False, 'status': 'Missing rwgps username or password'}),402

    username = request.form['username']
    password = request.form['password']
    rwgps_api_key = os.environ.get("RWGPS_API_KEY")
    if rwgps_api_key == None:
        return jsonify({'loggedIn': False, 'status': 'Missing rwgps API key'}),500

    login_result = session.get("https://ridewithgps.com/users/current.json",
                           params={'email': username, 'password': password, 'apikey': rwgps_api_key})
    if login_result.status_code == 401:
        return jsonify({'loggedIn': False, 'status':'Invalid rwgps login'}),login_result.status_code
    login_result.raise_for_status()
    userinfo = login_result.json()
    if userinfo["user"] is None:
        return jsonify({'loggedIn': False, 'status':'Invalid rwgps user'}),401
    return jsonify({'loggedIn':True})

@application.route('/submitted', methods=['POST'])
def submitted_form():
    if not request.form.viewkeys() >= {'interval','pace', 'starting_time'}:
        return jsonify({'status': 'Missing keys'}), 400
    interval = request.form['interval']
    starting_time = request.form['starting_time']
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
            contents = dl_req.content #dl_from_rwgps(route_number)
        else:
            return jsonify({'status':dl_req.reason}),dl_req.status_code
    else:
        return jsonify({'status': 'No route provided'}), 400
    with tempfile.NamedTemporaryFile(mode='w+') as local_file:
        local_file.write(contents)
        local_file.flush()
        wcalc = weather_calculator()
        try:
            forecast = wcalc.calc_weather(float(interval), pace, starting_time=starting_time, route=local_file.name, controls=controls)
        except requests.HTTPError as excpt:
            return jsonify({'status': excpt.message}), 500
        except Exception as excpt:
            return jsonify({'status':excpt.message}),500
        if wcalc.isError():
            return jsonify({'status': forecast}), 400
        bounds = wcalc.get_bounds()
        min_lat, min_lon, max_lat, max_lon = bounds
    return jsonify({'forecast':forecast,'min_lat':min_lat,'max_lat':max_lat, 'min_lon': min_lon, 'max_lon': max_lon,
                    'points': wcalc.get_points(), 'name':wcalc.get_name(),'controls':wcalc.get_controls()})

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    # application.debug = True
    application.run(threaded=True)
