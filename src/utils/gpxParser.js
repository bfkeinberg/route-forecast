//const gpxParse = require("gpx-parse-alpaca");
import {finishTimeFormat} from '../redux/reducer';
import { DateTime } from 'luxon';

import {getPowerOrVelocity} from "./windUtils";
import { inputPaceToSpeed, setMinMaxCoords } from './util';

const kmToMiles = 0.62137;
/**
 Begin section swiped from gpx parser
 */
const greatCircleRadius = {
        miles: 3956,
        km: 6367
};

class AnalyzeRoute {
    constructor() {
        this.walkRwgpsRoute = this.walkRwgpsRoute.bind(this);
        this.walkGpxRoute = this.walkGpxRoute.bind(this);
        this.analyzeRoute = this.analyzeRoute.bind(this);
    }

//    loadGpxFile(gpxFile) {
//        let reader = new FileReader();
//        const fileLoad = new Promise((resolve, reject) => {
//            reader.onerror = event => reject(event.target.error.code);
//            reader.onload = event => resolve(event.target.result);
//        });
//        reader.readAsText(gpxFile);
//        return new Promise((resolve, reject) => {
//            fileLoad.then(fileData => {
//                const parseGpx = new Promise((resolve, reject) => {
//                    gpxParse.parseGpx(fileData, (error, gpxData) => {
//                        if (error !== null) {
//                            reject(error);          // error in parsing the file
//                        }
//                        resolve(gpxData);
//                    })
//                });
//                parseGpx.then(gpxData => {
//                    resolve(gpxData);
//                }, error => {
//                    reject(error);      // error parsing gpx
//                });
//            }, error => {
//                reject(error);      // errors in reading the file
//            });
//        });
//    }

    toRad = (num) => num * Math.PI / 180;

    /**
     * Calculates the distance between the two points using the haversine method.
     * @param {number} lat1 The latitude of the first point.
     * @param {number} lon1 The longtitude of the first point.
     * @param {number} lat2 The latitude of the first point.
     * @param {number} lon2 The longtitude of the first point.
     * @returns {number} The distance in miles between the two points.
    **/
    calculateDistance(lat1, lon1, lat2, lon2) {
            var dLat = this.toRad((lat2 - lat1)),
                    dLon = this.toRad((lon2 - lon1));

            lat1 = this.toRad(lat1);
            lat2 = this.toRad(lat2);

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return greatCircleRadius.km * c;
    }


    // returns distance traveled in _miles_, and climb in meters
    findDeltas(previousPoint, currentPoint) {
        // calculate distance and elevation from last
        let distanceFromLast = this.calculateDistance(previousPoint.lat, previousPoint.lon,
            currentPoint.lat,currentPoint.lon);
        if (currentPoint.elevation > previousPoint.elevation) {
            return {distance:distanceFromLast,climb:currentPoint.elevation-previousPoint.elevation};
        } else {
            return {distance:distanceFromLast,climb:0};
        }
    }

    parseCoursePoints = (routeData, type) =>
        (type === "rwgps" ?
        routeData[routeData.type]['course_points'] :
        [])

    isControl = (coursePoint) => {
        const controlRegexp = /control|rest stop|regroup/i;
        return coursePoint.t === 'Control' || coursePoint.n.match(controlRegexp);
    }

    controlFromCoursePoint = (coursePoint) =>
        ({name:coursePoint.n, duration:1, distance:Math.round((coursePoint.d*kmToMiles)/1000)})

    extractControlPoints = (routeData, type) =>
        this.parseCoursePoints(routeData, type).filter(point => this.isControl(point)).map(point => this.controlFromCoursePoint(point))

    parseRouteStream = (routeData, type) =>
        (type === "rwgps" ?
        routeData[routeData.type]['track_points'].map(point => ({ lat: point.y, lon: point.x, elevation: point.e, dist: point.d })) :
        routeData.tracks.reduce((accum,current) => accum.concat(current.segments.reduce((accum,current) => accum.concat(current),[])),[]))


    computePointsAndBounds = (routeData, type) => {
        const stream = this.parseRouteStream(routeData, type)

        let bounds = { min_latitude: 90, min_longitude: 180, max_latitude: -90, max_longitude: -180 };

        stream
            .filter(point => point.lat !== undefined && point.lon !== undefined)
            .forEach(point => {
                bounds = setMinMaxCoords(point, bounds);
            })

        return {points: stream, bounds}
    };

    analyzeRoute(stream, userStartTime, pace, intervalInHours, controls, metric, timeZoneId) {

        let nextControl = 0;

        const checkAndUpdateControls = function(distanceInKm, startTime, elapsedTimeInHours, controls,
                                                calculatedValues, metric, point) {
            if (controls.length <= nextControl) {
                return 0;
            }
            if (metric)
            {
                if (distanceInKm < controls[nextControl].distance) {
                    return 0
                }
            }
            else {
                let distanceInMiles = distanceInKm*kmToMiles;
                if (distanceInMiles < controls[nextControl].distance) {
                    return 0
                }
            }
            let delayInMinutes = controls[nextControl].duration;
            let arrivalTime = startTime.plus({hours:elapsedTimeInHours});
            let banked = Math.round(AnalyzeRoute.rusa_time(distanceInKm, elapsedTimeInHours));
            calculatedValues.push({arrival:arrivalTime.toFormat(finishTimeFormat),
                banked: banked,
                val:controls[nextControl].id, lat:point.lat, lon:point.lon,
                distance:controls[nextControl].distance
            });
            nextControl++;
            return delayInMinutes/60;      // convert from minutes to hours
        };

        let forecastRequests = [];
        let baseSpeed = inputPaceToSpeed[pace];
        let first = true;
        let previousPoint = null;
        let forecastPoint = null;
        let accumulatedDistanceKm = 0;
        let accumulatedClimbMeters = 0;
        let accumulatedTime = 0;
        let idlingTime = 0;
        let calculatedValues = [];
        let lastTime = 0;
        let previousAccumulatedTime = 0;
        // correct start time for time zone
        let startTime = DateTime.fromISO(userStartTime.toFormat("yyyy-MM-dd'T'HH:mm"), {zone:timeZoneId});
        let bearings = [];
        stream.filter(point => point.lat!==undefined && point.lon!==undefined).forEach(point => {
            if (first) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, accumulatedTime, accumulatedDistanceKm * kmToMiles));
                forecastPoint = point;
                first = false;
            }
            else if (previousPoint !== null) {
                let deltas = this.findDeltas(previousPoint,point);
                accumulatedDistanceKm += deltas.distance;
                // accumulate elevation gain
                accumulatedClimbMeters += deltas.climb;
                // then find elapsed time given pace
                accumulatedTime = Math.max(
                    AnalyzeRoute.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed),
                    previousAccumulatedTime
                );
            }
            idlingTime += checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime),
                controls, calculatedValues, metric, point);
            // see if it's time for forecast
            if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, (accumulatedTime + idlingTime),
                    accumulatedDistanceKm * kmToMiles));
                lastTime = accumulatedTime + idlingTime;
                previousAccumulatedTime = accumulatedTime;
                bearings.push(AnalyzeRoute.getRelativeBearing(forecastPoint,point));
                forecastPoint = point;
            }
            previousPoint = point;
        });
        if (previousPoint !== null && accumulatedTime !== 0) {
            forecastRequests.push(AnalyzeRoute.addToForecast(previousPoint, startTime, (accumulatedTime + idlingTime),
                accumulatedDistanceKm * kmToMiles));
            let lastBearing = AnalyzeRoute.getRelativeBearing(forecastPoint,previousPoint);
            bearings.push(lastBearing);
            bearings.push(lastBearing);
        }
        let finishTime = AnalyzeRoute.formatFinishTime(startTime,accumulatedTime,idlingTime);
        AnalyzeRoute.fillLastControlPoint(finishTime, controls, nextControl, accumulatedTime + idlingTime,
            accumulatedDistanceKm, calculatedValues);
        calculatedValues.sort((a,b) => a.val-b.val);
        forecastRequests.forEach(request => request.bearing = bearings.shift());
        return {forecastRequest:forecastRequests,
            points:stream,values:calculatedValues,
            finishTime: finishTime, timeInHours:accumulatedTime + idlingTime};
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

    static fillLastControlPoint(finishTime, controls, nextControl, totalTime, totalDistanceInKm, calculatedValues) {
        while (nextControl < controls.length)   {
            // update banked time also, supplying final distance in km and total time taken
            let banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInKm, totalTime));
            calculatedValues.push({arrival:finishTime,banked:banked,val:controls[nextControl].distance});
            ++nextControl;
        }
    }

    static formatFinishTime(startTime,accumulatedTime,restTime) {
            return startTime.plus({hours:accumulatedTime+restTime}).toFormat(finishTimeFormat);
    }

    walkRwgpsRoute(routeData,startTime,pace,interval,controls,metric,timeZoneId) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        const stream = this.parseRouteStream(routeData, "rwgps")
        return this.analyzeRoute(stream, startTime, pace, interval, modifiedControls, metric, timeZoneId);
    }

    walkGpxRoute(routeData,startTime,pace,interval,controls,metric,timeZoneId) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        const stream = this.parseRouteStream(routeData, "gpx")
        return this.analyzeRoute(stream, startTime, pace, interval, modifiedControls, metric, timeZoneId);
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

    // in hours
    static calculateElapsedTime(climbInMeters,distanceInKm,baseSpeed) {
        let climbInFeet = (climbInMeters * 3.2808);
        let distanceInMiles = distanceInKm*kmToMiles;
        if (distanceInMiles < 1) {
            return 0;
        }
        let hilliness = Math.min(((climbInFeet / distanceInMiles) / 25), 6);
        // handle edge case for walking speeds
        let effectiveSpeed = baseSpeed - hilliness;
        // sanity checking
        if (baseSpeed <= hilliness) {
            effectiveSpeed = 1;
        }
        // cycling speeds less than 3 mph will not happen
        if (baseSpeed > 9 && effectiveSpeed < 3) {
            effectiveSpeed = 3;
        }
        // if the pace is a hiking pace, the cycling hilliness computation doesn't really work
        if (baseSpeed < 7) {
            effectiveSpeed = baseSpeed;
        }
        return distanceInMiles / effectiveSpeed;     // hours
    }

    static addToForecast(trackPoint, currentTime, elapsedTimeInHours, distanceInMiles) {
        return {lat:trackPoint.lat,lon:trackPoint.lon,distance:Math.round(distanceInMiles),
            time:currentTime.plus({hours:elapsedTimeInHours}).toFormat("yyyy-MM-dd'T'HH:mm:00ZZZ")};
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

    static windToTimeInMinutes(baseSpeed,distance,modifiedVelocity) {
        // will be negative for a tailwind
        return (distance*60)/modifiedVelocity-(distance*60)/baseSpeed;
    }

    adjustForWind = (forecastInfo,stream,pace,controls,previouslyCalculatedValues,start,metric,finishTime,timeZoneId) => {
        if (forecastInfo.length===0) {
            return {time:0,values:[],gustSpeed:0,finishTime:finishTime};
        }
        let baseSpeed = inputPaceToSpeed[pace];
        let forecast = forecastInfo.slice().reverse();
        let currentForecast = forecast.pop();
        let currentControl = 0;
        let previousPoint = null;
        let totalMinutesLost = 0;
        let totalDistanceInKm = 0;
        let calculatedValues = [];
        let maxGustSpeed = 0;

        stream.filter(point => point != null && point.lat !== undefined && point.lon !== undefined).forEach(currentPoint => {
            if (previousPoint !== null) {
                let distanceInKm = this.calculateDistance(previousPoint.lat, previousPoint.lon,
                    currentPoint.lat,currentPoint.lon);
                totalDistanceInKm += distanceInKm;

                let distanceInMiles = distanceInKm*kmToMiles;
                if (distanceInMiles === 0) {
                    return;
                }
                // get current forecast
                if (forecast.length > 0 && (totalDistanceInKm*kmToMiles)>forecast[forecast.length-1].distance) {
                    currentForecast = forecast.pop();
                }
                // get bearing between the two points
                let trackBearing = AnalyzeRoute.getRelativeBearing(previousPoint,currentPoint);
                let relativeBearing = AnalyzeRoute.getBearingBetween(trackBearing,currentForecast.windBearing);
                // adjust speed
                const averageWindSpeed = parseInt(currentForecast.windSpeed);
                if (currentForecast.gust !== undefined) {
                    let gustSpeed = parseInt(currentForecast.gust);
                    if (gustSpeed > maxGustSpeed) {
                        maxGustSpeed = gustSpeed;
                    }
                }
                let effectiveWindSpeed = Math.cos((Math.PI / 180)*relativeBearing)*averageWindSpeed;

                // sometimes the route data is missing elevation, so don't try to compute with it
                if (previousPoint.elevation!==undefined && currentPoint.elevation!==undefined) {
                    const power = getPowerOrVelocity(distanceInKm, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                        0, 0, undefined, baseSpeed);
                    const modifiedVelocity = getPowerOrVelocity(distanceInKm, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                        0, effectiveWindSpeed, power, baseSpeed);
                    totalMinutesLost += AnalyzeRoute.windToTimeInMinutes(baseSpeed, distanceInMiles, modifiedVelocity);
                }

                let desiredDistance = metric ? totalDistanceInKm: totalDistanceInKm*kmToMiles;
                currentControl = AnalyzeRoute.calculateValuesForWind(controls, previouslyCalculatedValues,
                    calculatedValues, currentControl,
                    desiredDistance, totalMinutesLost, start, totalDistanceInKm*kmToMiles, timeZoneId);
            }
            previousPoint = currentPoint;
        });

        calculatedValues.sort((a,b) => a.val-b.val);
        return {time:totalMinutesLost,values:calculatedValues, gustSpeed:maxGustSpeed,
                finishTime:DateTime.fromFormat(finishTime,finishTimeFormat).plus({minutes:totalMinutesLost}).toFormat(finishTimeFormat)};
    };

    static calculateValuesForWind(controls, previouslyCalculatedValues,
                                  calculatedValues, currentControl, desiredDistance,
                                  totalMinutesLost, start, totalDistanceInMiles, timeZoneId) {
        if (controls.length > currentControl) {
            if (desiredDistance >= controls[currentControl].distance) {
                let previousArrivalTime = DateTime.fromFormat(previouslyCalculatedValues[currentControl].arrival, finishTimeFormat, {zone:timeZoneId});
                let arrivalTime = previousArrivalTime.plus({minutes:totalMinutesLost});
                let elapsedDuration = arrivalTime.diff(start);
                let banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInMiles / kmToMiles, elapsedDuration.as('hours')));
                calculatedValues.push({...previouslyCalculatedValues[currentControl], arrival:arrivalTime.toFormat(finishTimeFormat),
                    banked:banked});

                currentControl++;
            }
        }
        return currentControl;
    }
}

export default new AnalyzeRoute();
