let gpxParse = require("gpx-parse-browser");
import moment from 'moment';

const paceToSpeed = {'A': 10, 'B': 12, 'C': 14, 'C+': 15, 'D-': 15, 'D': 16, 'D+': 17, 'E-': 17, 'E': 18};

class AnalyzeRoute {
    constructor(options) {
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
        this.reader.onload = this.fileDataRead;
        this.reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };
        this.reader.onprogress = this.inProcess;
        this.rwgpsRouteData = null;
        this.gpxResult = null;
        this.isTrip = false;
        this.setErrorStateCallback = options;
    }

    clear() {
        this.rwgpsRouteData = null;
        this.gpxResult = null;
    }

    routeIsLoaded() {
        return this.gpxResult != null || this.rwgpsRouteData != null;
    }

    fileDataRead(event) {
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
            this.setErrorStateCallback(null,null);
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
        xmlhttp.send();
    }

    analyzeRwgpsRoute(startTime,timezone,pace,intervalInHours,controls) {
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
        let points = this.rwgpsRouteData[rideType]['track_points'];
        for (let trackPoint of points) {
            let point = {'lat':trackPoint['y'],'lon':trackPoint['x'],'elevation':trackPoint['e']};
            bounds = this.setMinMaxCoords(point,bounds);
            if (first) {
                forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*0.62137));
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
            let addedTime = this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls);
            idlingTime += addedTime;
            // see if it's time for forecast
            if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*0.62137));
                lastTime = accumulatedTime + idlingTime;
                forecastPoint = point;
            }
            previousPoint = point;
        }
        if (previousPoint != null && accumulatedTime != 0) {
            forecastRequests.push(this.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*0.62137));
        }
        let finishTime = this.formatFinishTime(startTime,accumulatedTime,idlingTime);
        this.fillLastControlPoint(finishTime,controls,this.nextControl);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:controls,bounds:bounds,
            finishTime: finishTime};
    }

    getRelativeBearing(point1,point2) {
        const degreesToRadians = Math.PI / 180;
        let φ1 = point1.lat * degreesToRadians;
        let φ2 = point2.lat * degreesToRadians;
        let λ1 = point1.lon * degreesToRadians;
        let λ2 = point2.lon * degreesToRadians;
        let x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
        let y = Math.sin(λ2-λ1) * Math.cos(φ2);
        return Math.atan2(y, x) / degreesToRadians;
    }

    fillLastControlPoint(finishTime,controls,nextControl) {
        while (nextControl < controls.length)   {
            controls[nextControl]['arrival'] = finishTime;
            ++nextControl;
        }
    }

    formatFinishTime(startTime,accumulatedTime,restTime) {
        return moment(startTime).add(accumulatedTime+restTime,'hours').format('ddd, MMM DD h:mma');
    }

    walkRoute(startTime,timezone,pace,interval,controls) {
        controls.sort((a,b) => a['distance']-b['distance']);
        if (this.gpxResult != null) {
            return this.analyzeGpxRoute(startTime,timezone,pace,interval,controls);
        } else if (this.rwgpsRouteData != null) {
            return this.analyzeRwgpsRoute(startTime,timezone,pace,interval,controls);
        }
        return null;
    }

    analyzeGpxRoute(startTime, timezone, pace, intervalInHours, controls) {
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
        for (let track of this.gpxResult.tracks) {
            if (trackName == null) {
                trackName = track.name;
            }
            for (let segment of track.segments) {
                for (let point of segment) {
                    bounds = this.setMinMaxCoords(point,bounds);
                    if (first) {
                        forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*0.62137));
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
                    let addedTime = this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls);
                    idlingTime += addedTime;
                    // see if it's time for forecast
                    if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                        forecastRequests.push(this.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*0.62137));
                        lastTime = accumulatedTime + idlingTime;
                        forecastPoint = point;
                    }
                    previousPoint = point;
                }
            }
        }
        if (previousPoint != null && accumulatedTime != 0) {
            forecastRequests.push(this.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*0.62137));
        }
        let finishTime = this.formatFinishTime(startTime,accumulatedTime,idlingTime);
        this.fillLastControlPoint(finishTime,controls,this.nextControl);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:controls,bounds:bounds,
            finishTime:finishTime};
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

    checkAndUpdateControls(distanceInKm, startTime, elapsedTimeInHours, controls) {
        if (controls.length <= this.nextControl) {
            return 0;
        }
        let distanceInMiles = distanceInKm*0.62137;
        if (distanceInMiles < controls[this.nextControl]['distance']) {
            return 0
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
        let distanceInMiles = distanceInKm*0.62137;
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
}

export default AnalyzeRoute;
