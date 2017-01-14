import os
from datetime import datetime
from datetime import timedelta

import gpxpy.gpx
import numericalunits as nu
import requests

nu.reset_units()
nu.set_derived_units_and_constants()

class WeatherError(Exception):
    def __init__(self,value):
        self.value = value

    def __str__(self):
        return repr(self.value)

class weather_calculator:

    paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18}

    def __init__(self):
        self.min_latitude = 90
        self.min_longitude = 180
        self.max_latitude = -90
        self.max_longitude = -180
        self.error = False
        self.name = None;

    def isError(self):
        return self.error

    def get_bounds(self):
        return self.min_latitude,self.min_longitude,self.max_latitude,self.max_longitude

    def get_points(self):
        return self.pointsInRoute

    def get_name(self):
        return self.name

    def get_controls(self):
        return self.controls

    def calc_weather(self, forecast_interval_hours, pace, starting_time, route, controls):
        self.controls = controls
        with open(route, 'r') as gpx_file:
            try:
                gpx = gpxpy.parse(gpx_file)
            except Exception as e:
                self.error = True
                return "Unknown GPX parsing error" + e
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
            start_datetime = datetime.strptime(starting_time,'%Y-%m-%dT%H:%M')
        except:
            self.error = True
            return 'Invalid starting time'
        tracks = gpx.tracks
        for track in tracks:
            self.name = track.name
            for trkseg in track.segments:
                for trkpnt in trkseg.points:
                    self.pointsInRoute.append({'latitude':trkpnt.latitude,'longitude':trkpnt.longitude})
                    self.min_latitude = min(self.min_latitude, trkpnt.latitude)
                    self.max_latitude = max(self.max_latitude, trkpnt.latitude)
                    self.min_longitude = min(self.min_longitude, trkpnt.longitude)
                    self.max_longitude = max(self.max_longitude, trkpnt.longitude)
                    if old_trkpnt != None and trkpnt != None:
                        distance_from_last = trkpnt.distance_3d(old_trkpnt)
                        accum_distance += distance_from_last
                        segment_distance += distance_from_last

                        if trkpnt.elevation != None and prev_elevation != None and trkpnt.elevation > prev_elevation:
                            elevation_change += trkpnt.elevation - prev_elevation
                            delta_elevation_gain += trkpnt.elevation - prev_elevation

                        # calc elapsed time?
                        elapsed_time = self.calc_elapsed_time(delta_elevation_gain,segment_distance,base_speed)
                        accum_time = self.calc_elapsed_time(elevation_change,accum_distance,base_speed)
                    # distance_in_km = int(segment_distance/1000)
                    # if distance_in_km >= desired_length:

                    # add time due to stopping at controls
                    added_time = self.check_and_update_controls(accum_distance,start_datetime,
                                                                  (accum_time+idling_time),
                                                                  controls,elevation_change)
                    idling_time += added_time
                    segment_delay_time += added_time
                    if elapsed_time != None and (elapsed_time + segment_delay_time) >= forecast_interval_hours:
                        segment_distance = 0
                        elapsed_time = 0
                        segment_delay_time = 0
                        forecast.append(self.findWeatherAtPoint(elevation_change, accum_distance, trkpnt, base_speed, start_datetime))
                        delta_elevation_gain = 0
                    old_trkpnt = trkpnt
                    if trkpnt.elevation != None:
                        prev_elevation = trkpnt.elevation
        forecast.append(self.findWeatherAtPoint(elevation_change, accum_distance, trkpnt, base_speed, start_datetime))
        return forecast

    def check_and_update_controls(self,distance,start,time,controls,elevation):
        if len(controls) <= self.next_control:
            return 0
        distance_in_miles = (distance * nu.m) / nu.mile
        if distance_in_miles < int(controls[self.next_control]['distance']):
            return 0
        delayInMinutes = int(controls[self.next_control]['duration'])
        addedDelay = timedelta(seconds=(time*3600))
        arrivalTime = start + addedDelay
        controls[self.next_control]['arrival'] = arrivalTime.strftime('%a, %b %d %-I:%M%p')
        self.next_control = self.next_control + 1
        return float(delayInMinutes)/60      # convert from minutes to hours

    def calc_elapsed_time(self,elevationChange,distance,base_speed):
        elevation_in_feet = (elevationChange * nu.m) / nu.foot
        distance_in_miles = (distance * nu.m)/nu.mile
        if distance_in_miles < 1:
            return 0
        hilliness = int(min((elevation_in_feet / distance_in_miles) / 25,5))
        pace = base_speed - hilliness
        return distance_in_miles / pace # hours

    def findWeatherAtPoint(self,elevationChange,distance,where,base_speed,startDatetime):
        elevation_in_feet = (elevationChange * nu.m) / nu.foot
        distance_in_miles = (distance * nu.m)/nu.mile
        hilliness = int(min((elevation_in_feet / distance_in_miles) / 25,5))
        pace = base_speed - hilliness
        timeToCover = distance_in_miles / pace # hours
        elapsedTimeDelta = timedelta(hours=timeToCover)
        timeAtPoint = startDatetime + elapsedTimeDelta
        return self.callWeatherService(where.latitude,where.longitude,int(timeAtPoint.strftime("%s")))

    def callWeatherService(self,lat,lon,time):
        key = os.getenv('DARKSKY_API_KEY')
        url = "https://api.darksky.net/forecast/{}/{},{},{}?exclude=hourly,daily,flags".format(key,lat,lon,time)
        headers = {"Accept-Encoding": "gzip"}
        response = requests.get(url=url, headers=headers)
        if response.status_code==200:
            currentForecast = response.json()['currently']
            now = datetime.fromtimestamp(currentForecast['time'])
            return (now.strftime("%H:%M"),currentForecast['summary'],str(int(round(currentForecast['temperature'])))+'F',
                    str((currentForecast['precipProbability'] * 100)) + '%' if 'precipProbability' in currentForecast else '<unavailable>',
                    str(currentForecast['cloudCover'] * 100) + '%' if 'cloudCover' in currentForecast else '<unavailable>',
                    str(int(round(currentForecast['windSpeed']))) + ' mph' if 'windSpeed' in currentForecast else '<unavailable>',
                    lat, lon, int(round(currentForecast['temperature'])), now.strftime("%c")
                    )
        else:
            response.raise_for_status()
        return None

if __name__ == "__main__":
    gpx_file = open('/Users/bfeinberg/Downloads/Uvas_Gold_200k.gpx', 'r')
    gpx = gpxpy.parse(gpx_file)
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                print 'Point at ({0},{1}) -> {2}'.format(point.latitude, point.longitude, point.elevation)
    # 1 hour, D-pace, starting at 06:00PM
    # wcalc = weather_calculator()
    # print wcalc.calc_weather(forecast_interval_hours=1,pace='D',starting_time='2016-12-27T18:00',route="/users/bfeinberg/Downloads/pygpx-master/readme.rst")
    # print wcalc.calc_weather(forecast_interval_hours=1,pace='D',starting_time='2016-12-29T12:00',route="/Users/bfeinberg/Downloads/Sausalito_-_Freestone.gpx")
    # print wcalc.calc_weather(forecast_interval_hours=1,pace='D',starting_time='2016-12-29T12:00',route="/Users/bfeinberg/Downloads/Uvas_Gold_200k.gpx")


