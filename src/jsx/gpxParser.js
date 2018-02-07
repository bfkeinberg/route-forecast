let gpxParse = require("gpx-parse-browser");
import moment from 'moment-timezone';
import 'whatwg-fetch';

const paceToSpeed = {'A': 10, 'B': 12, 'C': 14, 'C+': 15, 'D-': 15, 'D': 16, 'D+': 17, 'E-': 17, 'E': 18};
const kmToMiles = 0.62137;

export const finishTimeFormat = 'ddd, MMM DD YYYY h:mma';

class AnalyzeRoute {
    constructor() {
        this.walkRoute = this.walkRoute.bind(this);
        this.checkAndUpdateControls = this.checkAndUpdateControls.bind(this);
        this.loadRwgpsRoute = this.loadRwgpsRoute.bind(this);
        this.loadGpxFile = this.loadGpxFile.bind(this);
        this.analyzeRwgpsRoute = this.analyzeRwgpsRoute.bind(this);
        this.analyzeGpxRoute = this.analyzeGpxRoute.bind(this);
        this.clear = this.clear.bind(this);
        this.adjustForWind = this.adjustForWind.bind(this);
        this.isTrip = false;
        this.points = [];
    }

    loadGpxFile(gpxFile, timezone_api_key) {
        let reader = new FileReader();
        const fileLoad = new Promise((resolve, reject) => {
            reader.onerror = event => reject(event.target.error.code);
            reader.onload = event => resolve(event.target.result);
        });
        reader.readAsText(gpxFile);
        return new Promise((resolve, reject) => {
            fileLoad.then(fileData => {
                const parseGpx = new Promise((resolve, reject) => {
                    gpxParse.parseGpx(fileData, (error, gpxData) => {
                        if (error !== null) {
                            reject(error);          // error in parsing the file
                        }
                        resolve(gpxData);
                    })
                });
                parseGpx.then(gpxData => {
                    let point = this.gpxResult.tracks[0].segments[0][0];
                    // using current date and time for zone lookup could pose a problem in future
                    let timeZonePromise = this.findTimezoneForPoint(point.lat, point.lon, moment(), timezone_api_key);
                    timeZonePromise.then(timeZoneResult => {
                            resolve({gpxRouteData:gpxData,timeZoneId:timeZoneResult.zoneId,timeZoneOffset:timeZoneResult.offset});
                        }, error => {
                            reject(error);          // error getting the time zone
                        }
                    );
                }, error => {
                    reject(error);      // error parsing gpx
                });
            }, error => {
                reject(error);      // errors in reading the file
            });
        });
    }

    clear() {
        this.points = [];
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

    loadRwgpsRoute(route, isTrip, timezone_api_key) {
        return new Promise((resolve, reject) => {
            this.isTrip = isTrip;
            fetch('/rwgps_route?route=' + route + '&trip=' + isTrip).then(response => {
                    if (response.status === 200) {
                        return response.json();
                    }
                }
            ).then(response => {
                if (response === undefined) {
                    reject(new Error("Could not get Ride with GPS results"));
                    return;
                }
                let rwgpsRouteDatum = response[response['trip'] === undefined ? 'route' : 'trip'];
                if (rwgpsRouteDatum === undefined) {
                    reject(new Error('RWGPS route info unavailable'));
                }
                let point = rwgpsRouteDatum['track_points'][0];
                //TODO using current date and time for zone lookup (moment()) could pose a problem in future
                let timeZonePromise = this.findTimezoneForPoint(point.y, point.x, moment(), timezone_api_key);
                timeZonePromise.then(timeZoneResult => {
                    resolve({rwgpsRouteData:response,timeZoneOffset:timeZoneResult.offset,timeZoneId:timeZoneResult.zoneId});
                }, error => {
                    reject(error);
                });
            },
            error => {
                reject(error.message);
            });
        });
    }

    analyzeRwgpsRoute(routeData,stream,userStartTime,pace,intervalInHours,controls,unsortedControls,metric,timeZoneId) {
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
        let trackName = routeData[rideType].name;
        let calculatedValues = [];
        let lastTime = 0;
        // correct start time for time zone
        let startTime = moment.tz(userStartTime.format('YYYY-MM-DDTHH:mm'), timeZoneId);
        let points = routeData[rideType].track_points;
        for (let trackPoint of points) {
            let point = {'lat':trackPoint['y'],'lon':trackPoint['x'],'elevation':trackPoint['e']};
            this.points.push(point);
            bounds = AnalyzeRoute.setMinMaxCoords(point,bounds);
            if (first) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*kmToMiles));
                first = false;
            }
            if (previousPoint !== null) {
                let deltas = this.findDeltas(previousPoint,point);
                accumulatedDistanceKm += deltas['distance'];
                // accumulate elevation gain
                accumulatedClimbMeters += deltas['climb'];
                // then find elapsed time given pace
                accumulatedTime = AnalyzeRoute.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed);
            }
            idlingTime += this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls, calculatedValues, metric);
            // see if it's time for forecast
            if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
                lastTime = accumulatedTime + idlingTime;
                forecastPoint = point;
            }
            previousPoint = point;
        }
        if (previousPoint !== null && accumulatedTime !== 0) {
            forecastRequests.push(AnalyzeRoute.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
        }
        let finishTime = AnalyzeRoute.formatFinishTime(startTime,accumulatedTime,idlingTime);
        AnalyzeRoute.fillLastControlPoint(finishTime,controls,this.nextControl,accumulatedTime+idlingTime,accumulatedDistanceKm);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:unsortedControls,
            bounds:bounds, finishTime: finishTime};
    }

    static getRelativeBearing(point1,point2) {
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

    static fillLastControlPoint(finishTime, controls, nextControl, totalTime, totalDistanceInKm) {
        while (nextControl < controls.length)   {
            controls[nextControl].arrival = finishTime;
            // update banked time also, supplying final distance in km and total time taken
            controls[nextControl].banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInKm, totalTime));
            if (isNaN(controls[nextControl].banked)) {
                console.error("Banked time is NaN in fillLastControlPoint");
            }
            ++nextControl;
        }
    }

    static formatFinishTime(startTime,accumulatedTime,restTime) {
        return moment(startTime).add(accumulatedTime+restTime,'hours').format(finishTimeFormat);
    }

    walkRoute(routeData,type,startTime,pace,interval,controls,metric,timeZoneId) {
        this.clear();
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        if (type === 'gpx') {
            let stream = this.gpxResult.tracks.reduce((accum,current) => accum.concat(current.segments.reduce((accum,current) => accum.concat(current))));
            return this.analyzeGpxRoute(routeData,startTime,pace,interval,modifiedControls,controls,metric,timeZoneId);
        } else if (type === 'rwgps') {
            let stream = this.rwgpsRouteData[rideType]['track_points'].map(point => ({'lat':point['y'],'lon':point['x'],'elevation':point['e']}));
            return this.analyzeRwgpsRoute(routeData,stream,startTime,pace,interval,modifiedControls,controls,metric,timeZoneId);
        }
        return null;
    }

    analyzeGpxRoute(routeData,userStartTime, pace, intervalInHours, controls, unsortedControls, metric, timeZoneId) {
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
        let calculatedValues = [];
        // correct start time for time zone
        let startTime = moment.tz(userStartTime.format('YYYY-MM-DDTHH:mm'), timeZoneId);
        for (let track of routeData.tracks) {
            if (trackName === null) {
                trackName = track.name;
            }
            for (let segment of track.segments) {
                for (let point of segment) {
                    this.points.push(point);
                    bounds = AnalyzeRoute.setMinMaxCoords(point,bounds);
                    if (first) {
                        forecastRequests.push(AnalyzeRoute.addToForecast(point, forecastPoint, startTime, accumulatedTime,accumulatedDistanceKm*kmToMiles));
                        first = false;
                    }
                    if (previousPoint !== null) {
                        let deltas = this.findDeltas(previousPoint,point);
                        accumulatedDistanceKm += deltas['distance'];
                        // accumulate elevation gain
                        accumulatedClimbMeters += deltas['climb'];
                        // then find elapsed time given pace
                        accumulatedTime = AnalyzeRoute.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed);
                    }
                    idlingTime += this.checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime), controls, calculatedValues, metric);
                    // see if it's time for forecast
                    if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                        forecastRequests.push(AnalyzeRoute.addToForecast(point, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
                        lastTime = accumulatedTime + idlingTime;
                        forecastPoint = point;
                    }
                    previousPoint = point;
                }
            }
        }
        if (previousPoint !== null && accumulatedTime !== 0) {
            forecastRequests.push(AnalyzeRoute.addToForecast(previousPoint, forecastPoint, startTime, (accumulatedTime + idlingTime),accumulatedDistanceKm*kmToMiles));
        }
        let finishTime = AnalyzeRoute.formatFinishTime(startTime,accumulatedTime,idlingTime);
        AnalyzeRoute.fillLastControlPoint(finishTime,controls,this.nextControl,accumulatedTime+idlingTime,accumulatedDistanceKm);
        return {forecast:forecastRequests,points:this.pointsInRoute,name:trackName,controls:unsortedControls,
            bounds:bounds, finishTime:finishTime};
    }

    findTimezoneForPoint(lat, lon, time, maps_api_key) {
        return new Promise((resolve, reject) =>
            {
                let xmlhttp = new XMLHttpRequest();
                xmlhttp.responseType = 'json';
                xmlhttp.addEventListener('load', event => {
                    if (event.currentTarget.response.status==='OK') {
                        // determine total timezone offset in seconds
                        let tzOffset = (event.currentTarget.response['dstOffset'] + event.currentTarget.response['rawOffset']);
                        // TODO: manipulating state in this way seems questionable
                        resolve({offset:tzOffset,zoneId:event.currentTarget.response['timeZoneId']});
                    }
                    else {
                        reject(event.currentTarget.response['error_message']);
                    }
                });
                let reqUrl = "https://maps.googleapis.com/maps/api/timezone/json?location=" + lat + "," + lon;
                reqUrl += "&timestamp=" + time.format("X") + "&key=" + maps_api_key;
                xmlhttp.open('GET',reqUrl,true);
                xmlhttp.send();
            }
        );
    }

    static rusa_time(accumulatedDistanceInKm, elapsedTimeInHours) {
         let closetimeMinutes;
        if (accumulatedDistanceInKm === 0) {
             return 0
         }

         let accumulatedDistance=accumulatedDistanceInKm*1000;
         let elapsedMinutes = elapsedTimeInHours * 60;
         if (accumulatedDistance <= 600000) {
             closetimeMinutes = accumulatedDistance * .004;         // 1 / 250;
         }
         else if (accumulatedDistance > 600000 && accumulatedDistance <= 1000000) {
             closetimeMinutes = 2400 + ((accumulatedDistance - 600000) * 0.00525);
         }
         else {           // 1000 - 1300 km
             closetimeMinutes = 4500 + ((accumulatedDistance - 1000000) * 0.0045);
         }
         return (closetimeMinutes - elapsedMinutes);
    }

    checkAndUpdateControls(distanceInKm, startTime, elapsedTimeInHours, controls, calculatedValues, metric) {
        if (controls.length <= this.nextControl) {
            return 0;
        }
        if (metric)
        {
            if (distanceInKm < controls[this.nextControl].distance) {
                return 0
            }
        }
        else {
            let distanceInMiles = distanceInKm*kmToMiles;
            if (distanceInMiles < controls[this.nextControl].distance) {
                return 0
            }
        }
        let delayInMinutes = controls[this.nextControl]['duration'];
        let arrivalTime = moment(startTime).add(elapsedTimeInHours,'hours');
        controls[this.nextControl].arrival = arrivalTime.format(finishTimeFormat);
        controls[this.nextControl].banked = Math.round(AnalyzeRoute.rusa_time(distanceInKm, elapsedTimeInHours));
        if (isNaN(controls[this.nextControl].banked)) {
            console.error("Banked time is NaN in checkAndUpdateControls");
        }
        this.nextControl++;
        return delayInMinutes/60;      // convert from minutes to hours
    }

    // in hours
    static calculateElapsedTime(climbInMeters,distanceInKm,baseSpeed) {
        let climbInFeet = (climbInMeters * 3.2808);
        let distanceInMiles = distanceInKm*kmToMiles;
        if (distanceInMiles < 1) {
            return 0;
        }
        let hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
        return distanceInMiles / (baseSpeed - hilliness);     // hours
    }

    static setMinMaxCoords(trackPoint,bounds) {
        bounds['min_latitude'] = Math.min(trackPoint.lat, bounds['min_latitude']);
        bounds['min_longitude'] = Math.min(trackPoint.lon, bounds['min_longitude']);
        bounds['max_latitude'] = Math.max(trackPoint.lat, bounds['max_latitude']);
        bounds['max_longitude'] = Math.max(trackPoint.lon, bounds['max_longitude']);
        return bounds;
    }

    static addToForecast(trackPoint, earlierTrackPoint, currentTime, elapsedTimeInHours, distance) {
        let bearing = null;
        if (earlierTrackPoint !== null) {
            bearing = AnalyzeRoute.getRelativeBearing(earlierTrackPoint,trackPoint);
        }
        return {lat:trackPoint.lat,lon:trackPoint.lon,distance:Math.round(distance),
            time:moment(currentTime).add(elapsedTimeInHours,'hours').format('YYYY-MM-DDTHH:mm:00ZZ'),bearing:bearing};
    }

    parseRoute(gpxFile) {
        this.reader.readAsText(gpxFile);
    }

    static getBearingBetween(trackBearing,windBearing) {
        let relative_bearing2;
        let relative_bearing1;
        if ((trackBearing - windBearing) < 0) {
            relative_bearing1 = (trackBearing - windBearing) + 360;
        }
        else {
            relative_bearing1 = trackBearing - windBearing;
        }
        if ((windBearing - trackBearing) < 0) {
            relative_bearing2 = (windBearing - trackBearing) + 360;
        }
        else {
            relative_bearing2 = windBearing - trackBearing;
        }
        return Math.min(relative_bearing1,relative_bearing2);
    }

    static windToTimeInMinutes(baseSpeed,distance,hilliness,windSpeed) {
        let adjustedWindSpeed;
        let initialSpeed = baseSpeed - hilliness;
        switch (hilliness) {
            case 0:
                adjustedWindSpeed = windSpeed * 0.5;
                break;
            case 1:
                adjustedWindSpeed = windSpeed * 0.45;
                break;
            case 2:
                adjustedWindSpeed = windSpeed * 0.4;
                break;
            case 3:
                adjustedWindSpeed = windSpeed * 0.35;
                break;
            case 4:
                adjustedWindSpeed = windSpeed * 0.3;
                break;
            default:
                adjustedWindSpeed = windSpeed * 0.25;
        }
        let effectiveSpeed = initialSpeed - adjustedWindSpeed;
        // will be negative for a tailwind
        return (distance*60)/effectiveSpeed-(distance*60)/initialSpeed;
    }

    adjustForWind(forecastInfo,pace,controls,start,metric) {
        let climbInMeters;
        if (forecastInfo.length===0) {
            return 0;
        }
        let baseSpeed = paceToSpeed[pace];
        let forecast = forecastInfo.forecast.slice().reverse();
        let currentForecast = forecast.pop();
        let currentControl = 0;
        let previousPoint = null;
        let totalMinutesLost = 0;
        let totalDistanceInMiles = 0;
        let hilliness;

        for (let currentPoint of this.points) {
            if (previousPoint !== null) {
                let distanceInMiles = gpxParse.utils.calculateDistance(previousPoint.lat, previousPoint.lon,
                    currentPoint.lat,currentPoint.lon);
                totalDistanceInMiles += distanceInMiles;
                if (currentPoint.elevation > previousPoint.elevation) {
                    climbInMeters = currentPoint.elevation - previousPoint.elevation;
                }
                else {
                    climbInMeters = 0;
                }
                let climbInFeet = (climbInMeters * 3.2808);
                if (distanceInMiles !== 0) {
                    hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
                }
                else {
                    continue;
                }
                // get current forecast
                if (forecast.length > 0 && totalDistanceInMiles>forecast[forecast.length-1][1]) {
                    currentForecast = forecast.pop();
                }
                // get bearing between the two points
                let trackBearing = AnalyzeRoute.getRelativeBearing(previousPoint,currentPoint);
                let relativeBearing = AnalyzeRoute.getBearingBetween(trackBearing,currentForecast[13]);
                // adjust speed
                let effectiveWindSpeed = Math.cos((Math.PI / 180)*relativeBearing)*parseInt(currentForecast[6]);
                totalMinutesLost += AnalyzeRoute.windToTimeInMinutes(baseSpeed, distanceInMiles, hilliness, effectiveWindSpeed);

                let desiredDistance = metric ? (totalDistanceInMiles/kmToMiles) : totalDistanceInMiles;
                if (controls.length > currentControl) {
                    if (desiredDistance >= controls[currentControl].distance) {
                        let previousArrivalTime = moment(controls[currentControl]['arrival'],finishTimeFormat);
                        let arrivalTime = previousArrivalTime.add(totalMinutesLost,'minutes');
                        controls[currentControl]['arrival'] = arrivalTime.format(finishTimeFormat);
                        let elapsedTimeMs = arrivalTime.toDate()-start;
                        let elapsedDuration = moment.duration(elapsedTimeMs,'ms');
                        controls[currentControl].banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInMiles/kmToMiles, elapsedDuration.asHours()));
                        if (isNaN(controls[currentControl].banked)) {
                            console.error("Banked time is NaN in adjustForWind");
                        }

                        currentControl++;
                    }
                }

            }
            previousPoint = currentPoint;
        }
        return totalMinutesLost;
    }
}

export default new AnalyzeRoute();
