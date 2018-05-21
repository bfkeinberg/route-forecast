import logging
import numericalunits as nu
import os
from datetime import *
import StringIO
import gzip

nu.reset_units()
nu.set_derived_units_and_constants()

from google.appengine.api import urlfetch
import json

class WeatherError(Exception):
    def __init__(self, value, details):
        self.value = value
        self.details = details.rstrip()

    def __str__(self):
        return repr(self.value) + ' ' + repr(self.details)


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
        self.api_calls = 0
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

    def get_api_calls(self):
        return self.api_calls

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
        if response.status_code == 200:
            response_data = response.content
            if 'content-encoding' in response.headers and response.headers['content-encoding'] == 'gzip':
                response_data = gzip.GzipFile(fileobj=StringIO.StringIO(response.content)).read()
            try:
                json_response = json.loads(response_data)
            except ValueError as ve:
                self.logger.error('Error in DarkSky response - %s %s', ve, response.content)
                ve.args += (response.content,)
                raise
            self.api_calls = response.headers['x-forecast-api-calls']
            current_forecast = json_response['currently']
            now = datetime.fromtimestamp(current_forecast['time'], zone)
            has_wind = 'windSpeed' in current_forecast
            wind_bearing = current_forecast['windBearing'] if 'windBearing' in current_forecast else None
            relative_bearing = self.get_bearing_difference(bearing, wind_bearing) \
                if has_wind and bearing != None and wind_bearing != None else None
            rainy = 'icon' in current_forecast and current_forecast['icon'] == 'rain'
            self.logger.info('%s %f,%f %s %d %d', now, lat, lon, current_forecast,bearing if bearing!=None else 0,relative_bearing if relative_bearing!=None else 0)
            return {
                "time":now.strftime("%-I:%M%p"),
                "distance":distance,
                "summary":current_forecast['summary'],
                "tempStr":str(int(round(current_forecast['temperature'])))+'F',
                "precip":str((current_forecast['precipProbability'] * 100)) + '%'
                    if 'precipProbability' in current_forecast else '<unavailable>',
                "cloudCover":str(current_forecast['cloudCover'] * 100) + '%'
                    if 'cloudCover' in current_forecast else '<unavailable>',
                "windSpeed":str(int(round(current_forecast['windSpeed']))) + ' mph'
                    if has_wind else '<unavailable>',
                "lat":lat,
                "lon":lon,
                "temp":int(round(current_forecast['temperature'])),
                "fullTime":now.strftime("%a %b %-d %-I:%M%p %Y"),
                "relBearing":relative_bearing,
                "rainy":rainy,
                "windBearing":wind_bearing,
                "vectorBearing":bearing,
                "gust":str(int(round(current_forecast['windGust'])))  + ' mph' if "windGust" in current_forecast else '<unavailable>'
            }
        else:
            raise WeatherError(value=response.status_code,details=response.content)
        return None
