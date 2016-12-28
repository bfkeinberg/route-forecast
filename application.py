import logging
import os
import random
import string
import tempfile

import requests
from flask import Flask, render_template, request, redirect, url_for
from flask import flash
from flask_bower import Bower

from routeWeather import weather_calculator

application = Flask(__name__)
application.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
secret_key = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(4))
application.secret_key = secret_key
logged_into_rwgps = False
Bower(application)
session = requests.Session()

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
    username = request.form['username']
    password = request.form['password']
    rwgps_api_key = os.environ.get("RWGPS_API_KEY")

    login_result = session.get("https://ridewithgps.com/users/current.json",
                           params={'email': username, 'password': password, 'apikey': rwgps_api_key})
    if login_result.status_code == 401:
        flash('Invalid rwgps login', 'error')
        return render_template('form.html', disabled='disabled style=' + "'color:#888;'")
    login_result.raise_for_status()
    userinfo = login_result.json()
    if userinfo["user"] is None:
        flash('Invalid rwgps login', 'error')
        render_template('form.html', disabled='disabled style=' + "'color:#888;'")
    member_id = userinfo["user"]["id"]
    logged_into_rwgps = True
    return render_template('form.html', disabled='')

@application.route('/submitted', methods=['POST'])
def submitted_form():
    interval = request.form['interval']
    starting_time = request.form['starting_time']
    pace = request.form['pace']
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
            flash(dl_req.reason, 'error')
            return redirect(url_for('form'))
    else:
        flash("No route provided", 'error')
        return redirect(url_for('form'))
    with tempfile.NamedTemporaryFile(mode='w+') as local_file:
        local_file.write(contents)
        local_file.flush()
        wcalc = weather_calculator()
        forecast = wcalc.calc_weather(float(interval), pace, starting_time=starting_time, route=local_file.name)
        bounds = wcalc.get_bounds()
        min_lat, min_lon, max_lat, max_lon = bounds
        if wcalc.isError():
            flash(forecast, 'error')
            return redirect(url_for('form'))
    return render_template(
        'submitted_form.html',
        forecast=forecast, min_lat=min_lat, max_lat=max_lat, min_lon=min_lon, max_lon=max_lon, points=wcalc.get_points())

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    # application.debug = True
    application.run()
