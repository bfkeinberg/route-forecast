import logging
import numericalunits as nu
import os
from datetime import *

nu.reset_units()
nu.set_derived_units_and_constants()

from google.appengine.api import urlfetch
import json

class WeatherError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)


class WeatherCalculator:

    def __init__(self,session):
        self.min_latitude = 90
        self.min_longitude = 180
        self.max_latitude = -90
        self.max_longitude = -180
        self.error = False
        self.name = None
        self.controls = None
        self.next_control = None
        self.pointsInRoute = None
        self.logger = logging.getLogger('WeatherCalculator')
        self.session = session
        logging.basicConfig(level=logging.INFO)

    def is_error(self):
        return self.error

    def get_bounds(self):
        return self.min_latitude, self.min_longitude, self.max_latitude, self.max_longitude

    def get_points(self):
        return self.pointsInRoute

    def get_name(self):
        return self.name

    def get_controls(self):
        return self.controls

    def get_bearing_difference(self,bearing,windBearing):
        if (bearing - windBearing) < 0:
            relative_bearing1 = bearing - windBearing + 360
        else:
            relative_bearing1 = bearing - windBearing
        if (windBearing - bearing) < 0:
            relative_bearing2 = windBearing - bearing + 360
        else:
            relative_bearing2 = windBearing - bearing
        return min(relative_bearing1,relative_bearing2)

    def call_weather_service(self, lat, lon, current_time, distance, zone, bearing):
        key = os.getenv('DARKSKY_API_KEY')
        url = "https://api.darksky.net/forecast/{}/{},{},{}?exclude=hourly,daily,flags".format(key, lat, lon, current_time)
        headers = {"Accept-Encoding": "gzip"}
        response = urlfetch.fetch(url, headers=headers, validate_certificate=True)
        # response = self.session.get(url=url, headers=headers)
        # if True: #response.status_code == 200:
        if response.status_code == 200:
            # current_forecast = {u'ozone': 310.21, u'temperature': 53.32, u'icon': u'partly-cloudy-day', u'dewPoint': 45.71, u'humidity': 0.75, u'visibility': 10, u'summary': u'Partly Cloudy', u'apparentTemperature': 53.32, u'pressure': 1027.3, u'windSpeed': 4.65, u'cloudCover': 0.37, u'time': 1485391860, u'windBearing': 290, u'precipIntensity': 0, u'precipProbability': 0}
            current_forecast = json.loads(response.content)['currently']
            now = datetime.fromtimestamp(current_forecast['time'], zone)
            has_wind = 'windSpeed' in current_forecast
            wind_bearing = current_forecast['windBearing'] if has_wind else None
            relative_bearing = self.get_bearing_difference(bearing, current_forecast['windBearing']) if has_wind and bearing != None else None
            rainy = 'icon' in current_forecast and current_forecast['icon'] == 'rain'
            self.logger.info('%s %f,%f %s %d %d', now, lat, lon, current_forecast,bearing if bearing!=None else 0,relative_bearing if relative_bearing!=None else 0)
            return (now.strftime("%-I:%M%p"),
                    distance,
                    current_forecast['summary'],
                    str(int(round(current_forecast['temperature'])))+'F',
                    str((current_forecast['precipProbability'] * 100)) + '%'
                    if 'precipProbability' in current_forecast else '<unavailable>',
                    str(current_forecast['cloudCover'] * 100) + '%'
                    if 'cloudCover' in current_forecast else '<unavailable>',
                    str(int(round(current_forecast['windSpeed']))) + ' mph'
                    if has_wind else '<unavailable>',
                    lat,
                    lon,
                    int(round(current_forecast['temperature'])),
                    now.strftime("%a %b %-d %-I:%M%p %Y"),
                    relative_bearing,
                    rainy,
                    wind_bearing
                    )
        else:
            response.raise_for_status()
        return None
