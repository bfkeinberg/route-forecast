import os
from datetime import *
import dateutil.tz

import gpxpy.gpx
import numericalunits as nu
import requests

import logging

nu.reset_units()
nu.set_derived_units_and_constants()


class WeatherError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)


class WeatherCalculator:

    paceToSpeed = {'A': 10, 'B': 12, 'C': 14, 'C+': 15, 'D-': 15, 'D': 16, 'D+': 17, 'E-': 17, 'E': 18}

    def __init__(self):
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

    def calc_weather(self, forecast_interval_hours, pace, starting_time, tz, route, controls):
        self.controls = controls
        with open(route, 'r') as local_gpx_file:
            try:
                gpx_obj = gpxpy.parse(local_gpx_file)
            except Exception as e:
                self.error = True
                return "Unknown GPX parsing error" + e.message
        elevation_change = 0
        delta_elevation_gain = 0
        accum_distance = 0
        segment_distance = 0
        old_trkpnt = None
        prev_elevation = None
        elapsed_time = None
        accum_time = 0
        forecast = []
        self.pointsInRoute = []
        self.next_control = 0
        idling_time = 0
        segment_delay_time = 0

        base_speed = self.paceToSpeed[pace]
        # month day year hour:minute (24-hour)
        try:
            offset = long(tz) * 60
            req_tzinfo = dateutil.tz.tzoffset('local', offset)
            start_datetime = datetime.fromtimestamp(long(starting_time), req_tzinfo)
        except Exception as excpt:
            self.error = True
            return 'Invalid starting time' + excpt.message
        trkpnt = None
        first_forecast = True
        tracks = gpx_obj.tracks
        for track_obj in tracks:
            self.name = track_obj.name
            for trkseg in track_obj.segments:
                for trkpnt in trkseg.points:
                    if first_forecast:
                        forecast.append(self.find_weather_at_point(elevation_change, accum_distance, trkpnt, base_speed,
                                                                   start_datetime, req_tzinfo))
                        first_forecast = False
                    self.pointsInRoute.append({'latitude': trkpnt.latitude, 'longitude': trkpnt.longitude})
                    self.min_latitude = min(self.min_latitude, trkpnt.latitude)
                    self.max_latitude = max(self.max_latitude, trkpnt.latitude)
                    self.min_longitude = min(self.min_longitude, trkpnt.longitude)
                    self.max_longitude = max(self.max_longitude, trkpnt.longitude)
                    if old_trkpnt is not None:
                        distance_from_last = trkpnt.distance_3d(old_trkpnt)
                        accum_distance += distance_from_last
                        segment_distance += distance_from_last

                        if trkpnt.elevation is not None and prev_elevation is not None and \
                           trkpnt.elevation > prev_elevation:
                            elevation_change += trkpnt.elevation - prev_elevation
                            delta_elevation_gain += trkpnt.elevation - prev_elevation

                        # calc elapsed time?
                        elapsed_time = self.calc_elapsed_time(delta_elevation_gain, segment_distance, base_speed)
                        accum_time = self.calc_elapsed_time(elevation_change, accum_distance, base_speed)
                    # distance_in_km = int(segment_distance/1000)
                    # if distance_in_km >= desired_length:

                    # add time due to stopping at controls
                    added_time = self.check_and_update_controls(accum_distance, start_datetime,
                                                                (accum_time + idling_time),
                                                                controls)
                    idling_time += added_time
                    segment_delay_time += added_time
                    if elapsed_time is not None and (elapsed_time + segment_delay_time) >= forecast_interval_hours:
                        segment_distance = 0
                        elapsed_time = 0
                        segment_delay_time = 0
                        forecast.append(self.find_weather_at_point(elevation_change, accum_distance, trkpnt,
                                                                   base_speed, start_datetime, req_tzinfo))
                        delta_elevation_gain = 0
                    old_trkpnt = trkpnt
                    if trkpnt.elevation is not None:
                        prev_elevation = trkpnt.elevation
        if trkpnt is not None:
            forecast.append(self.find_weather_at_point(elevation_change, accum_distance, trkpnt,
                                                       base_speed, start_datetime, req_tzinfo))
        return forecast

    def check_and_update_controls(self, distance, start, elapsed_time, controls):
        if len(controls) <= self.next_control:
            return 0
        distance_in_miles = (distance * nu.m) / nu.mile
        if distance_in_miles < int(controls[self.next_control]['distance']):
            return 0
        delay_in_minutes = int(controls[self.next_control]['duration'])
        added_delay = timedelta(seconds=(elapsed_time * 3600))
        arrival_time = start + added_delay
        controls[self.next_control]['arrival'] = arrival_time.strftime('%a, %b %d %-I:%M%p')
        controls[self.next_control]['banked'] = \
            str(int(round(self.rusa_time(accum_distance=distance, accum_time=elapsed_time)))) + 'min'
        self.next_control += 1
        return float(delay_in_minutes)/60      # convert from minutes to hours

    def rusa_time(self, accum_distance, accum_time):
        if accum_distance == 0:
            return 0

        elapsed_mins = accum_time * 60

        if accum_distance <= 600000:
            closetime_mins = accum_distance * .004  # 1 / 250
        elif accum_distance > 600000 and accum_distance <= 1000000:
            closetime_mins = 2400 + ((accum_distance - 600000) * 0.00525)
        else:           # 1000 - 1300 km
            closetime_mins = 4500 + ((accum_distance - 1000000) * 0.0045)
        return closetime_mins - elapsed_mins

    def calc_elapsed_time(self, elevation_change, distance, base_speed):
        elevation_in_feet = (elevation_change * nu.m) / nu.foot
        distance_in_miles = (distance * nu.m)/nu.mile
        if distance_in_miles < 1:
            return 0
        hilliness = int(min((elevation_in_feet / distance_in_miles) / 25, 5))
        pace = base_speed - hilliness
        return distance_in_miles / pace     # hours

    def find_weather_at_point(self, elevation_change, distance, where, base_speed, start_datetime, zone):
        elevation_in_feet = (elevation_change * nu.m) / nu.foot
        distance_in_miles = (distance * nu.m)/nu.mile
        if distance_in_miles > 0:
            hilliness = int(min((elevation_in_feet / distance_in_miles) / 25, 5))
        else:
            hilliness = 0
        pace = base_speed - hilliness
        time_to_cover = distance_in_miles / pace       # hours
        elapsed_time_delta = timedelta(hours=time_to_cover)
        time_at_point = start_datetime + elapsed_time_delta
        forecast_time = time_at_point.strftime('%Y-%m-%dT%H:%M:00%z')
        return self.call_weather_service(where.latitude, where.longitude, forecast_time, zone)

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
        response = requests.get(url=url, headers=headers)
        # if True: #response.status_code == 200:
        if response.status_code == 200:
            # current_forecast = {u'ozone': 310.21, u'temperature': 53.32, u'icon': u'partly-cloudy-day', u'dewPoint': 45.71, u'humidity': 0.75, u'visibility': 10, u'summary': u'Partly Cloudy', u'apparentTemperature': 53.32, u'pressure': 1027.3, u'windSpeed': 4.65, u'cloudCover': 0.37, u'time': 1485391860, u'windBearing': 290, u'precipIntensity': 0, u'precipProbability': 0}
            current_forecast = response.json()['currently']
            now = datetime.fromtimestamp(current_forecast['time'], zone)
            has_wind = 'windSpeed' in current_forecast
            relative_bearing = self.get_bearing_difference(bearing, current_forecast['windBearing']) if has_wind and bearing != None else None
            self.logger.info('%s %f,%f %s', now, lat, lon, current_forecast)
            return (now.strftime("%-I:%M%p"), distance, current_forecast['summary'],
                    str(int(round(current_forecast['temperature'])))+'F',
                    str((current_forecast['precipProbability'] * 100)) + '%'
                    if 'precipProbability' in current_forecast else '<unavailable>',
                    str(current_forecast['cloudCover'] * 100) + '%'
                    if 'cloudCover' in current_forecast else '<unavailable>',
                    str(int(round(current_forecast['windSpeed']))) + ' mph'
                    if has_wind else '<unavailable>',
                    lat, lon, int(round(current_forecast['temperature'])), now.strftime("%c"),
                    relative_bearing
                    )
        else:
            response.raise_for_status()
        return None
