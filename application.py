import logging
import os
import random
import string
import tempfile

import requests
from flask import Flask, render_template, request, redirect, url_for
from flask import flash

from routeWeather import weather_calculator

application = Flask(__name__)
application.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024
secret_key = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(4))
application.secret_key = secret_key
logged_into_rwgps = False

@application.context_processor
def inject_maps_keys():
    return dict(maps_key=os.getenv('MAPS_KEY','NONE'))

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
    return render_template('form.html')

def dl_from_rwgps(route_number):
    gpx_url = "https://ridewithgps.com/routes/{}.gpx?sub_format=track".format(route_number)
    dl_req = requests.get(gpx_url)
    return dl_req.content

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
        if logged_into_rwgps==False:
            session = requests.Session()
            login_result = session.get('https://ridewithgps.com/#login_form')
        route_number = request.form['ridewithgps']
        gpx_url = "https://ridewithgps.com/trips/{}.gpx?sub_format=track".format(route_number)
        dl_req = session.get(gpx_url)
        if dl_req.status_code == 200:
            contents = dl_from_rwgps(route_number)
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
