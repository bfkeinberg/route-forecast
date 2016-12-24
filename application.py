import logging
from flask import Flask, render_template, request, redirect, url_for
import tempfile

from routeWeather import weather_calculator

application = Flask(__name__)
application.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

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

@application.route('/submitted', methods=['POST'])
def submitted_form():
    interval = request.form['interval']
    starting_time = request.form['starting_time']
    pace = request.form['pace']
    files = request.files
    route = files['route']
    with tempfile.NamedTemporaryFile(mode='w+') as local_file:
        local_file.write(route.read())
        local_file.flush()
        wcalc = weather_calculator()
        forecast = wcalc.calc_weather(float(interval), pace, starting_time=starting_time, route=local_file.name)
        bounds = wcalc.get_bounds()
        min_lat, min_lon, max_lat, max_lon = bounds
    return render_template(
        'submitted_form.html',
        forecast=forecast, min_lat=min_lat, max_lat=max_lat, min_lon=min_lon, max_lon=max_lon, points=wcalc.get_points())

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    # application.debug = True
    application.run()
