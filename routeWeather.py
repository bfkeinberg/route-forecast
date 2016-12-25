from flask import flash
from pygpx import GPX
import numericalunits as nu
import requests
from datetime import datetime
from datetime import timedelta
nu.reset_units()
nu.set_derived_units_and_constants()

class weather_calculator:

    paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18}

    def __init__(self):
        self.min_latitude = 90
        self.min_longitude = 180
        self.max_latitude = -90
        self.max_longitude = -180

    def get_bounds(self):
        return self.min_latitude,self.min_longitude,self.max_latitude,self.max_longitude

    def get_points(self):
        return self.pointsInRoute

    def calc_weather(self, forecast_interval_hours, pace, starting_time, route):
        try:
            gpx = GPX(route)
        except:
            return ["Invalid route file", 0, 0]
        elevation_change = 0
        delta_elevation_gain = 0
        accum_distance = 0
        segment_distance = 0
        old_trkpnt = None
        elapsed_time = None
        forecast = []
        self.pointsInRoute = []

        base_speed = self.paceToSpeed[pace]
        # month day year hour:minute (24-hour)
        try:
            start_datetime = datetime.strptime(starting_time,'%Y-%m-%dT%H:%M')
        except:
            flash('Invalid starting time','error')
        tracks = gpx.tracks
        for track in tracks:
            for trkseg in track.trksegs:
                for trkpnt in trkseg.trkpts:
                    self.pointsInRoute.append(trkpnt)
                    self.min_latitude = min(self.min_latitude, trkpnt.lat)
                    self.max_latitude = max(self.max_latitude, trkpnt.lat)
                    self.min_longitude = min(self.min_longitude, trkpnt.lon)
                    self.max_longitude = max(self.max_longitude, trkpnt.lon)
                    if old_trkpnt != None:
                        distance_from_last = trkpnt.distance(old_trkpnt)
                        accum_distance += distance_from_last
                        segment_distance += distance_from_last

                        if trkpnt.elevation > old_trkpnt.elevation:
                            elevation_change += trkpnt.elevation - old_trkpnt.elevation
                            delta_elevation_gain += trkpnt.elevation - old_trkpnt.elevation

                        # calc elapsed time?
                        elapsed_time = self.calc_elapsed_time(delta_elevation_gain,segment_distance,base_speed)
                    # distance_in_km = int(segment_distance/1000)
                    # if distance_in_km >= desired_length:
                    if elapsed_time != None and elapsed_time >= forecast_interval_hours:
                        segment_distance = 0
                        elapsed_time = 0
                        forecast.append(self.findWeatherAtPoint(elevation_change, accum_distance, trkpnt, base_speed, start_datetime))
                        delta_elevation_gain = 0
                    old_trkpnt = trkpnt
        lastPoint = gpx.end()
        forecast.append(self.findWeatherAtPoint(gpx.elevation_gain(), gpx.distance(), lastPoint, base_speed, start_datetime))
        return forecast

    def calc_elapsed_time(self,elevationChange,distance,base_speed):
        elevation_in_feet = (elevationChange * nu.m) / nu.foot
        distance_in_miles = (distance * nu.m)/nu.mile
        if distance_in_miles == 0:
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
        return self.callWeatherService(where.lat,where.lon,int(timeAtPoint.strftime("%s")))

    def callWeatherService(self,lat,lon,time):
        key ="9f1075d7f3960b4ec949f0dddae04cfc"
        url = "https://api.darksky.net/forecast/{}/{},{},{}?exclude=hourly,daily,flags".format(key,lat,lon,time)
        headers = {"Accept-Encoding": "gzip"}
        response = requests.get(url=url, headers=headers)
        if response.status_code==200:
            currentForecast = response.json()['currently']
            now = datetime.fromtimestamp(currentForecast['time'])
            return (now.strftime("%H:%M"),currentForecast['summary'],str(currentForecast['temperature'])+'F',
                    str((currentForecast['precipProbability'] * 100)) + '%' if 'precipProbability' in currentForecast else '<unavailable>',
                    str(currentForecast['cloudCover'] * 100) + '%' if 'cloudCover' in currentForecast else '<unavailable>',
                    str(currentForecast['windSpeed']) + ' mph' if 'windSpeed' in currentForecast else '<unavailable>',
                    lat, lon, int(round(currentForecast['temperature'])), now.strftime("%c")
                    )

if __name__ == "__main__":
    # 1 hour, D-pace, starting at 06:00PM
    wcalc = weather_calculator()
    # print wcalc.calc_weather(forecast_interval_hours=1,pace='D',starting_time='2016-12-27T18:00',route="/users/bfeinberg/Downloads/pygpx-master/readme.rst")
    print wcalc.calc_weather(forecast_interval_hours=1,pace='D',starting_time='2016-12-27T18:00',route="/users/bfeinberg/Downloads/Uvas_Gold_200k.gpx")


