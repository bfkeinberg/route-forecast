let gpxParse = require("gpx-parse-browser");
import moment from 'moment-timezone';

const paceToSpeed = {'A': 10, 'B': 12, 'C': 14, 'C+': 15, 'D-': 15, 'D': 16, 'D+': 17, 'E-': 17, 'E': 18};
const kmToMiles = 0.62137;

class AnalyzeRoute {
    constructor(options,maps_api_key) {
        this.reader = new FileReader();
        this.fileDataRead = this.fileDataRead.bind(this);
        this.handleParsedGpx = this.handleParsedGpx.bind(this);
        this.walkRoute = this.walkRoute.bind(this);
        this.setMinMaxCoords = this.setMinMaxCoords.bind(this);
        this.checkAndUpdateControls = this.checkAndUpdateControls.bind(this);
        this.routeIsLoaded = this.routeIsLoaded.bind(this);
        this.loadRwgpsRoute = this.loadRwgpsRoute.bind(this);
        this.analyzeRwgpsRoute = this.analyzeRwgpsRoute.bind(this);
        this.analyzeGpxRoute = this.analyzeGpxRoute.bind(this);
        this.rwgpsRouteCallback = this.rwgpsRouteCallback.bind(this);
        this.rwgpsErrorCallback = this.rwgpsErrorCallback.bind(this);
        this.clear = this.clear.bind(this);
        this.adjustForWind = this.adjustForWind.bind(this);
        this.reader.onload = this.fileDataRead;
        this.reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };
        this.reader.onprogress = this.inProcess;
        this.rwgpsRouteData = null;
        this.gpxResult = null;
        this.isTrip = false;
        this.setErrorStateCallback = options;
        this.points = [];
        this.maps_api_key = maps_api_key;
        this.timeZone = null;
        this.timeZoneId = null;
    }

    clear() {
        this.rwgpsRouteData = null;
        this.gpxResult = null;
        this.points = [];
    }

    routeIsLoaded() {
        return this.gpxResult != null || this.rwgpsRouteData != null;
    }

    fileDataRead(event) {
        this.timeZone = null;
        gpxParse.parseGpx(event.target.result, this.handleParsedGpx);
    }

    inProcess(event) {

    }

    handleParsedGpx(error,data)
    {
        if (error != null) {
            this.setErrorStateCallback(event.target.statusText,'gpx');
        } else {
            this.gpxResult = data;
            let point = this.gpxResult.tracks[0].segments[0][0];
            // using current date and time for zone lookup could pose a problem in future
            let timeZonePromise = this.findTimezoneForPoint(point.lat,point.lon,new moment());
            timeZonePromise.then(timeZoneResult => {
                    this.timeZone = timeZoneResult;
                    this.setErrorStateCallback(null,'gpx');
                }, error => {
                    this.setErrorStateCallback(error,'gpx');
                }
            );
            this.setErrorStateCallback(null,'gpx');
        }
    }

    // returns distance traveled in _miles_, and climb in meters
    findDeltas(previousPoint, currentPoint) {
        this.pointsInRoute.push({'latitude': currentPoint.lat, 'longitude': currentPoint.lon});
        // calculate distance and elevation from last
        let distanceFromLast = gpxParse.utils.calculateDistance(previousPoint.lat, previousPoint.lon,
            currentPoint.lat,currentPoint.lon);
        if (currentPoint.elevation > previousPoint.elevation) {
            return {distance:distanceFromLast,climb:currentPoint.elevation-previousPoint.elevation};
        } else {
            return {distance:distanceFromLast,climb:0};
        }
    }

    rwgpsRouteCallback(event) {
        if (event.target.status == 200) {
            this.rwgpsRouteData = event.target.response;
            this.gpxResult = null;
            //TODO route type is hard-coded below, will cause a problem if we ever expose trip support
            let point = this.rwgpsRouteData['route']['track_points'][0];
            //TODO using current date and time for zone lookup could pose a problem in future
            let timeZonePromise = this.findTimezoneForPoint(point.y,point.x,new moment());
            timeZonePromise.then(timeZoneResult => {
                this.timeZone = timeZoneResult;
                this.setErrorStateCallback(null,null);
            }, error => {
                this.setErrorStateCallback(error,'rwgps');
            }
            );
        } else {
            if (event.target.response != null) {
                this.setErrorStateCallback(event.target.response['status'],'rwgps');
            }
            else {
                this.setErrorStateCallback(event.target.statusText,'rwgps');
            }
        }
    }

    rwgpsErrorCallback(event) {
        this.setErrorStateCallback(event.target.statusText,'rwgps');
    }

    loadRwgpsRoute(route,isTrip) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onload = this.rwgpsRouteCallback;
        xmlhttp.onerror = this.rwgpsErrorCallback;
        xmlhttp.responseType = 'json';
        xmlhttp.open("GET", '/rwgps_route?route=' + route + '&trip=' + isTrip);
        this.isTrip = isTrip;
        this.rwgpsRouteData = null;
        this.timeZone = null;
        xmlhttp.send();
    }

    analyzeRwgpsRoute(userStartTime,pace,intervalInHours,controls,metric) {
        this.nextControl = 0;
        this.pointsInRoute = [];
        let forecastRequests = [];
        let baseSpeed = paceToSpeed[pace];
        let bounds = {min_latitude:90, min_longitude:180, max_latitude:-90, max_longitude:-180};
        let first = true;
        let previousPoint = null;
        let forecastPoint = null;
        let accumulatedDistanceKm = 0;
        let accumulatedClimbMeters = 0;
        let accumulatedTime = 0;
        let idlingTime = 0;
        let rideType = this.isTrip ? 'trip' : 'route';
        let trackName = this.rwgpsRouteData[rideType]['name'];

        let lastTime = 0;
        // correct start time for time zone
        let startTime = new moment.tz(userStartTime.format('YYYY-MM-DDTHH:mm'),this.timeZoneId);
        let points = this.rwgpsRouteData[rideType]['track_points'];
        for (let trackPoint of points) {
            let point = {'lat':trackPoint['y'],'lon':trackPoint['x'],'elevation':trackPoint['e']};
            this.points.push(point);
            bounds = this.setMinMaxCoords(point,bounds);
            if (first) {
                forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*kmToMiles));
                first = false;
            }
            if (previousPoint != null) {
                let deltas = this.findDeltas(previousPoint,point);
                accumulatedDistanceKm += deltas['distance'];
                // accumulate elevation gain
                accumulatedClimbMeters += deltas['climb'];
                // then find elapsed time given pace
                accumulatedTime = this.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed);
            }
            let addedTime = this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls, metric);
            idlingTime += addedTime;
            // see if it's time for forecast
            if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
                lastTime = accumulatedTime + idlingTime;
                forecastPoint = point;
            }
            previousPoint = point;
        }
        if (previousPoint != null && accumulatedTime != 0) {
            forecastRequests.push(this.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
        }
        let finishTime = this.formatFinishTime(startTime,accumulatedTime,idlingTime);
        this.fillLastControlPoint(finishTime,controls,this.nextControl,accumulatedTime+idlingTime,accumulatedDistanceKm);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:controls,bounds:bounds,
            finishTime: finishTime, timeZone:this.timeZone};
    }

    getRelativeBearing(point1,point2) {
        const degreesToRadians = Math.PI / 180;
        let φ1 = point1.lat * degreesToRadians;
        let φ2 = point2.lat * degreesToRadians;
        let λ1 = point1.lon * degreesToRadians;
        let λ2 = point2.lon * degreesToRadians;
        let x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
        let y = Math.sin(λ2-λ1) * Math.cos(φ2);
        let relative_bearing = Math.atan2(y, x) / degreesToRadians;
        if (relative_bearing < 0) {
            return 360 + relative_bearing;
        }
        return relative_bearing;
    }

    fillLastControlPoint(finishTime,controls,nextControl,totalTime,totalDistanceInKm) {
        while (nextControl < controls.length)   {
            controls[nextControl]['arrival'] = finishTime;
            // update banked time also, supplying final distance in km and total time taken
            controls[nextControl]['banked'] = Math.round(this.rusa_time(totalDistanceInKm, totalTime));
            ++nextControl;
        }
    }

    formatFinishTime(startTime,accumulatedTime,restTime) {
        return moment(startTime).add(accumulatedTime+restTime,'hours').format('ddd, MMM DD h:mma');
    }

    walkRoute(startTime,pace,interval,controls,metric) {
        controls.sort((a,b) => a['distance']-b['distance']);
        if (this.gpxResult != null) {
            return this.analyzeGpxRoute(startTime,pace,interval,controls,metric);
        } else if (this.rwgpsRouteData != null) {
            return this.analyzeRwgpsRoute(startTime,pace,interval,controls,metric);
        }
        return null;
    }

    analyzeGpxRoute(userStartTime, pace, intervalInHours, controls, metric) {
        this.nextControl = 0;
        this.pointsInRoute = [];
        let forecastRequests = [];
        let baseSpeed = paceToSpeed[pace];
        let bounds = {min_latitude:90, min_longitude:180, max_latitude:-90, max_longitude:-180};
        let first = true;
        let previousPoint = null;
        let forecastPoint = null;
        let accumulatedDistanceKm = 0;
        let accumulatedClimbMeters = 0;
        let accumulatedTime = 0;
        let idlingTime = 0;
        let trackName = null;
        let lastTime = 0;
        // correct start time for time zone
        let startTime = new moment.tz(userStartTime.format('YYYY-MM-DDTHH:mm'),this.timeZoneId);
        for (let track of this.gpxResult.tracks) {
            if (trackName == null) {
                trackName = track.name;
            }
            for (let segment of track.segments) {
                for (let point of segment) {
                    this.points.push(point);
                    bounds = this.setMinMaxCoords(point,bounds);
                    if (first) {
                        forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*kmToMiles));
                        first = false;
                    }
                    if (previousPoint != null) {
                        let deltas = this.findDeltas(previousPoint,point);
                        accumulatedDistanceKm += deltas['distance'];
                        // accumulate elevation gain
                        accumulatedClimbMeters += deltas['climb'];
                        // then find elapsed time given pace
                        accumulatedTime = this.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed);
                    }
                    let addedTime = this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls, metric);
                    idlingTime += addedTime;
                    // see if it's time for forecast
                    if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                        forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
                        lastTime = accumulatedTime + idlingTime;
                        forecastPoint = point;
                    }
                    previousPoint = point;
                }
            }
        }
        if (previousPoint != null && accumulatedTime != 0) {
            forecastRequests.push(this.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
        }
        let finishTime = this.formatFinishTime(startTime,accumulatedTime,idlingTime);
        this.fillLastControlPoint(finishTime,controls,this.nextControl,accumulatedTime+idlingTime,accumulatedDistanceKm);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:controls,bounds:bounds,
            finishTime:finishTime,timeZone:this.timeZone};
    }

    findTimezoneForPoint(lat,lon,time) {
        const promise = new Promise((resolve, reject) =>
            {
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.responseType = 'json';
                xmlhttp.addEventListener('load', event => {
                    if (event.currentTarget.response.status=='OK') {
                        // determine total timezone offset in seconds
                        let tzOffset = (event.currentTarget.response['dstOffset'] + event.currentTarget.response['rawOffset']);
                        // TODO: manipulating state in this way seems questionable
                        this.timeZoneId = event.currentTarget.response['timeZoneId'];
                        resolve(tzOffset);
                    }
                    else {
                        reject(event.currentTarget.response.error_message);
                    }
                });
                let reqUrl = "https://maps.googleapis.com/maps/api/timezone/json?location=" + lat + "," + lon;
                reqUrl += "&timestamp=" + time.format("X") + "&key=" + 'AIzaSyBS_wyxfIuLDEJWNOKs4w1NqbmwSDjLqCE';
                xmlhttp.open('GET',reqUrl,true);
                xmlhttp.send();
            }
        );

        return promise;
    }

    rusa_time(accumulatedDistanceInKm, elapsedTimeInHours) {
         if (accumulatedDistanceInKm == 0) {
             return 0
         }

         let accumulatedDistance=accumulatedDistanceInKm*1000;
         let elapsedMinutes = elapsedTimeInHours * 60;
         if (accumulatedDistance <= 600000) {
             var closetimeMinutes = accumulatedDistance * .004;         // 1 / 250;
         }
         else if (accumulatedDistance > 600000 && accumulatedDistance <= 1000000) {
             var closetimeMinutes = 2400 + ((accumulatedDistance - 600000) * 0.00525);
         }
         else {           // 1000 - 1300 km
             var closetimeMinutes = 4500 + ((accum_distance - 1000000) * 0.0045);
         }
         return (closetimeMinutes - elapsedMinutes);
    }

    checkAndUpdateControls(distanceInKm, startTime, elapsedTimeInHours, controls, metric) {
        if (controls.length <= this.nextControl) {
            return 0;
        }
        if (metric)
        {
            if (distanceInKm < controls[this.nextControl]['distance']) {
                return 0
            }
        }
        else {
            let distanceInMiles = distanceInKm*kmToMiles;
            if (distanceInMiles < controls[this.nextControl]['distance']) {
                return 0
            }
        }
        let delayInMinutes = controls[this.nextControl]['duration'];
        let arrivalTime = moment(startTime).add(elapsedTimeInHours,'hours');
        controls[this.nextControl]['arrival'] = arrivalTime.format('ddd, MMM DD h:mma');
        controls[this.nextControl]['banked'] = Math.round(this.rusa_time(distanceInKm, elapsedTimeInHours));
        this.nextControl++;
        return delayInMinutes/60;      // convert from minutes to hours
    }

    // in hours
    calculateElapsedTime(climbInMeters,distanceInKm,baseSpeed) {
        let climbInFeet = (climbInMeters * 3.2808);
        let distanceInMiles = distanceInKm*kmToMiles;
        if (distanceInMiles < 1) {
            return 0;
        }
        let hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
        return distanceInMiles / (baseSpeed - hilliness);     // hours
    }

    setMinMaxCoords(trackPoint,bounds) {
        bounds['min_latitude'] = Math.min(trackPoint.lat, bounds['min_latitude']);
        bounds['min_longitude'] = Math.min(trackPoint.lon, bounds['min_longitude']);
        bounds['max_latitude'] = Math.max(trackPoint.lat, bounds['max_latitude']);
        bounds['max_longitude'] = Math.max(trackPoint.lon, bounds['max_longitude']);
        return bounds;
    }

    addToForecast(trackPoint, earlierTrackPoint, currentTime, elapsedTimeInHours, distance) {
        let bearing = null;
        if (earlierTrackPoint != null) {
            bearing = this.getRelativeBearing(earlierTrackPoint,trackPoint);
        }
        return {lat:trackPoint.lat,lon:trackPoint.lon,distance:Math.round(distance),
            time:moment(currentTime).add(elapsedTimeInHours,'hours').format('YYYY-MM-DDTHH:mm:00ZZ'),bearing:bearing};
    }

    parseRoute(gpxFile) {
        this.reader.readAsText(gpxFile);
    }

    getBearingBetween(trackBearing,windBearing) {
        if ((trackBearing - windBearing) < 0) {
            var relative_bearing1 = (trackBearing - windBearing) + 360;
        }
        else {
            var relative_bearing1 = trackBearing - windBearing;
        }
        if ((windBearing - trackBearing) < 0) {
            var relative_bearing2 = (windBearing - trackBearing) + 360;
        }
        else {
            var relative_bearing2 = windBearing - trackBearing;
        }
        return Math.min(relative_bearing1,relative_bearing2);
    }

    windToTimeInMinutes(baseSpeed,distance,hilliness,windSpeed) {
        let initialSpeed = baseSpeed - hilliness;
        switch (hilliness) {
            case 0:
                var adjustedWindSpeed = windSpeed * 0.5;
            case 1:
                var adjustedWindSpeed = windSpeed * 0.45;
            case 2:
                var adjustedWindSpeed = windSpeed * 0.4;
            case 3:
                var adjustedWindSpeed = windSpeed * 0.35;
            case 4:
                var adjustedWindSpeed = windSpeed * 0.3;
            default: var adjustedWindSpeed = windSpeed*0.25;
        }
        var effectiveSpeed = initialSpeed - adjustedWindSpeed;
        // will be negative for a tailwind
        return (distance*60)/effectiveSpeed-(distance*60)/initialSpeed;
    }

    adjustForWind(forecastInfo,pace,controls,start,metric) {
        if (forecastInfo.length==0) {
            return 0;
        }
        let baseSpeed = paceToSpeed[pace];
        let forecast = forecastInfo.forecast.slice().reverse();
        let currentForecast = forecast.pop();
        let currentControl = 0;
        let previousPoint = null;
        let totalMinutesLost = 0;
        let totalDistanceInMiles = 0;

        for (let currentPoint of this.points) {
            if (previousPoint != null) {
                let distanceInMiles = gpxParse.utils.calculateDistance(previousPoint.lat, previousPoint.lon,
                    currentPoint.lat,currentPoint.lon);
                totalDistanceInMiles += distanceInMiles;
                if (currentPoint.elevation > previousPoint.elevation) {
                    var climbInMeters = currentPoint.elevation - previousPoint.elevation;
                }
                else {
                    var climbInMeters = 0;
                }
                let climbInFeet = (climbInMeters * 3.2808);
                if (distanceInMiles != 0) {
                    var hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
                }
                else {
                    continue;
                }
                // get current forecast
                if (forecast.length > 0 && totalDistanceInMiles>forecast[forecast.length-1][1]) {
                    currentForecast = forecast.pop();
                }
                // get bearing between the two points
                let trackBearing = this.getRelativeBearing(previousPoint,currentPoint);
                let relativeBearing = this.getBearingBetween(trackBearing,currentForecast[13]);
                // adjust speed
                let effectiveWindSpeed = Math.cos((Math.PI / 180)*relativeBearing)*parseInt(currentForecast[6]);
                let minutesChange = this.windToTimeInMinutes(baseSpeed,distanceInMiles,hilliness,effectiveWindSpeed);
                totalMinutesLost += minutesChange;

                let desiredDistance = metric ? (totalDistanceInMiles/kmToMiles) : totalDistanceInMiles;
                if (controls.length > currentControl) {
                    if (desiredDistance >= controls[currentControl]['distance']) {
                        let previousArrivalTime = moment(controls[currentControl]['arrival'],'ddd, MMM DD h:mma');
                        let arrivalTime = previousArrivalTime.add(totalMinutesLost,'minutes');
                        controls[currentControl]['arrival'] = arrivalTime.format('ddd, MMM DD h:mma');
                        let elapsedTimeMs = arrivalTime.toDate()-start;
                        let elapsedDuration = moment.duration(elapsedTimeMs,'ms');
                        controls[currentControl]['banked'] = Math.round(this.rusa_time(distanceInMiles/kmToMiles, elapsedDuration.asHours()));
                        currentControl++;
                    }
                }

            }
            previousPoint = currentPoint;
        }
        return totalMinutesLost;
    }
}

export default AnalyzeRoute;
