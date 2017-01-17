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
        this.reader.onload = this.fileDataRead;
        this.reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };
        this.reader.onprogress = this.inProcess;
    }

    fileDataRead(event) {
        gpxParse.parseGpx(event.target.result, this.handleParsedGpx);
    }

    inProcess(event) {

    }

    handleParsedGpx(error,data)
    {
        if (error != null) {
            console.log(error);
        } else {
            this.gpxResult = data;
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

    walkRoute(startTime,timezone,pace,interval,controls) {
        this.nextControl = 0;
        this.pointsInRoute = [];
        let forecastRequests = [];
        let baseSpeed = paceToSpeed[pace];
        let bounds = {min_latitude:90, min_longitude:180, max_latitude:-90, max_longitude:-180};
        let first = true;
        let previousPoint = null;
        let accumulatedDistanceKm = 0;
        let accumulatedClimbMeters = 0;
        let accumulatedTime = 0;
        let segmentDistanceKm = 0;
        let segmentClimbMeters = 0;
        let segmentTime = 0;
        let idlingTime = 0;
        let segmentIdlingTime = 0;
        let trackName = null;
        for (let track of this.gpxResult.tracks) {
            if (trackName == null) {
                trackName = track.name;
            }
            for (let segment of track.segments) {
                for (let point of segment) {
                    bounds = this.setMinMaxCoords(point,bounds);
                    if (first) {
                        forecastRequests.push(this.addToForecast(point,startTime,accumulatedTime));
                        first = false;
                    }
                    if (previousPoint != null) {
                        let deltas = this.findDeltas(previousPoint,point);
                        segmentDistanceKm += deltas['distance'];
                        // accumulate elevation gain
                        segmentClimbMeters += deltas['climb'];
                        // then find elapsed time given pace
                        segmentTime = this.calculateElapsedTime(segmentClimbMeters, segmentDistanceKm, baseSpeed);
                    }
                    let addedTime = this.checkAndUpdateControls(accumulatedDistanceKm+segmentDistanceKm, startTime,
                        (accumulatedTime + idlingTime), controls);
                    idlingTime += addedTime;
                    segmentIdlingTime += addedTime;
                    // see if it's time for forecast
                    if ((segmentTime + segmentIdlingTime) >= interval) {
                        forecastRequests.push(this.addToForecast(point,startTime,
                            (accumulatedTime+segmentTime+segmentIdlingTime)));
                        accumulatedDistanceKm += segmentDistanceKm; segmentDistanceKm = 0;
                        accumulatedTime += segmentTime; segmentTime = 0;
                        accumulatedClimbMeters += segmentClimbMeters; segmentClimbMeters = 0;
                        segmentIdlingTime = 0;
                    }
                    previousPoint = point;
                }
            }
        }
        if (previousPoint != null) {
            forecastRequests.push(this.addToForecast(previousPoint,startTime,
                (accumulatedTime+segmentTime+segmentIdlingTime)));
        }
        console.log('Elapsed time was',segmentTime+accumulatedTime,
            'total distance',segmentDistanceKm+accumulatedDistanceKm,'total climb',accumulatedClimbMeters+segmentClimbMeters);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:controls,bounds:bounds};
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
        let delayInMinutes = controls[this.next_control]['duration'];
        let arrivalTime = startTime.add(elapsedTimeInHours,'hours');
        controls[this.nextControl]['arrival'] = arrivalTime.format('ddd, MMM DD h:mma');
        controls[this.nextControl]['banked'] = Math.round(self.rusa_time(accumulatedDistanceInKm, elapsedTimeInHours)) + 'min';
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

    addToForecast(trackPoint,currentTime,elapsedTimeInHours) {
        return {lat:trackPoint.lat,lon:trackPoint.lon,
            time:currentTime.add(elapsedTimeInHours,'hours').format('YYYY-MM-DDTHH:mm:00ZZ')};
    }

    parseRoute(gpxFile) {
        this.reader.readAsText(gpxFile);
    }
}

export default AnalyzeRoute;
