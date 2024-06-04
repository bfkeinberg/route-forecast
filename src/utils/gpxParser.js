let gpxParser = require('gpxparser')
import { DateTime } from 'luxon';

import {finishTimeFormat} from '../redux/reducer';
import { inputPaceToSpeed, setMinMaxCoords } from './util';
import {getPowerOrVelocity} from "./windUtils"
import * as Sentry from "@sentry/browser"

const kmToMiles = 0.62137;
/**
 Begin section swiped from gpx parser
 */
const greatCircleRadius = {
        miles: 3956,
        km: 6367
};

const desiredSeparationInMeters = 25;       // meters of distance desired between two points for grade calculation
class AnalyzeRoute {
    constructor() {
        this.walkRwgpsRoute = this.walkRwgpsRoute.bind(this);
        this.walkGpxRoute = this.walkGpxRoute.bind(this);
        this.analyzeRoute = this.analyzeRoute.bind(this);
        this.loadGpxFile = this.loadGpxFile.bind(this)
    }

    toRad = (num) => num * Math.PI / 180;

    loadGpxFile(gpxFileData) {
        // eslint-disable-next-line new-cap
        const gpx = new gpxParser()
        gpx.parse(gpxFileData)
        return {gpxData:{tracks:gpx.tracks,name:gpx.metadata.name}}
    }

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

    /**
     * Return a point far enough behind to make grade calculation meaningful, a constant defined
     * above specifies that distance. If the traversal hasn't progressed that far return the earliest point.
     * @param {array} previousPoints The array of already encountered course points, may be empty
     * @param {object} point The point for which we are searching for a predecessor
     * @returns {object} the point at the specified distance behind or undefined if this is the first point
     */
    findPreviousPoint = (previousPoints, point) => {
        if (previousPoints.length > 0) {
            let discoveredPoint = previousPoints.slice().reverse().find(previous =>
                (this.calculateDistance(previous.lat, previous.lon, point.lat, point.lon)*1000) > desiredSeparationInMeters);
            return discoveredPoint == undefined ? previousPoints[0] : discoveredPoint;
        }
        return undefined;
    }

    // get grade between two points
    getGrade(previousPoints, currentPoint) {
        let grade = 0;
        let trailingPoint = this.findPreviousPoint(previousPoints,currentPoint);
        let distanceFromPreviousInKm =
            this.calculateDistance(trailingPoint.lat,trailingPoint.lon,currentPoint.lat,currentPoint.lon);
        if (distanceFromPreviousInKm !== 0 && trailingPoint.elevation !== undefined)
        {
            grade = (currentPoint.elevation - trailingPoint.elevation) / (distanceFromPreviousInKm*1000);
        }
        return grade;
    }

    // returns distance traveled in _miles_, and climb in meters, along with the grade between the two points
    // in future we may want to expand this to calculate grade over a greater distance
    findDeltas(previousPoint, currentPoint) {
        // calculate distance and elevation from last at desired distance behind
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
        return coursePoint.d !== undefined && coursePoint.t === 'Control' || (coursePoint.n && coursePoint.n.match(controlRegexp) && !coursePoint.n.startsWith('Depart control'))
    }

    controlFromCoursePoint = (coursePoint) =>
        ({name:coursePoint.n.replace(':','_'), duration:1, distance:Math.round((coursePoint.d*kmToMiles)/1000)})

    extractControlPoints = (routeData, type) =>
        this.parseCoursePoints(routeData, type).filter(point => this.isControl(point)).map(point => this.controlFromCoursePoint(point))

    parseRouteStream = (routeData, type) =>
    (type === "rwgps" ?
        routeData[routeData.type]['track_points']
            .filter(point => point.x !== undefined && point.y !== undefined)
            .map(point => ({ lat: point.y, lon: point.x, elevation: point.e, dist: point.d })) :
        routeData.tracks.reduce((accum, current) => accum.concat(current.points, []), []))


    computePointsAndBounds = (routeData, type) => {
        const stream = this.parseRouteStream(routeData, type)

        let bounds = { min_latitude: 90, min_longitude: 180, max_latitude: -90, max_longitude: -180 };

        stream
            .forEach(point => {
                bounds = setMinMaxCoords(point, bounds);
            })
        return {pointList: stream, bounds}
    };

    analyzeRoute(stream, userStartTime, pace, intervalInHours, controls, timeZoneId, segment) {

        let nextControl = 0;

        const checkAndUpdateControls = function(distanceInKm, startTime, elapsedTimeInHours, controls,
                                                calculatedValues, point) {
            if (controls.length <= nextControl) {
                return 0;
            }
            let distanceInMiles = distanceInKm*kmToMiles;
            if (distanceInMiles < controls[nextControl].distance) {
                return 0
            }
            let delayInMinutes = controls[nextControl].duration;
            let arrivalTime = startTime.plus({hours:elapsedTimeInHours});
            let banked = Math.round(AnalyzeRoute.rusa_time(distanceInKm, elapsedTimeInHours));
            calculatedValues.push({arrival:arrivalTime.toFormat(finishTimeFormat),
                banked: banked,
                val:controls[nextControl].id, lat:point.lat, lon:point.lon,
                distance:controls[nextControl].distance
            });
            // add the control to the forecast request
            if (distanceInMiles > 0) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, (accumulatedTime + idlingTime),
                    accumulatedDistanceKm * kmToMiles, true));
                bearings.push(AnalyzeRoute.getRelativeBearing(forecastPoint, point));
            }
            //           
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
        const filterFunc = (point) => {
            return (point.lat!==undefined && point.lon!==undefined)
        }
        const filterToSegment = (point) => {
            return (point.lat!==undefined && point.lon!==undefined && point.dist<=segment[1])
        }
        const substream = (segment[1]>segment[0]) ? stream.filter(filterToSegment) : stream.filter(filterFunc)
        substream.forEach(point => {
            const shouldSkip = point.dist < segment[0] 
            if (first && !shouldSkip) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, accumulatedTime, accumulatedDistanceKm * kmToMiles));
                if (forecastPoint) {
                    bearings.push(AnalyzeRoute.getRelativeBearing(forecastPoint,point));
                }
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
            // can't repro issue with NaN passed into this method so just check for it preventively
            if (!isNaN(accumulatedTime) && !isNaN(idlingTime)) {
                idlingTime += checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime),
                controls, calculatedValues, point);
                // see if it's time for forecast
                if (!shouldSkip && ((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                    forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, (accumulatedTime + idlingTime),
                        accumulatedDistanceKm * kmToMiles));
                    lastTime = accumulatedTime + idlingTime;
                    previousAccumulatedTime = accumulatedTime;
                    if (forecastPoint) {
                        bearings.push(AnalyzeRoute.getRelativeBearing(forecastPoint,point));
                    }
                    forecastPoint = point;
                }
            } else {
                Sentry.captureMessage(`Invalid accumulated or idling times ${accumulatedTime} ${idlingTime}`)
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
        // console.info(`setting finish time ${finishTime} from start ${startTime} accumulated ${accumulatedTime} and idling ${idlingTime}`);
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

    walkRwgpsRoute(routeData,startTime,pace,interval,controls,timeZoneId, segment) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        const stream = this.parseRouteStream(routeData, "rwgps")
        return this.analyzeRoute(stream, startTime, pace, interval, modifiedControls, timeZoneId, segment);
    }

    walkGpxRoute(routeData,startTime,pace,interval,controls,timeZoneId, segment) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        const stream = this.parseRouteStream(routeData, "gpx")
        return this.analyzeRoute(stream, startTime, pace, interval, modifiedControls, timeZoneId, segment);
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
        let effectiveSpeed = AnalyzeRoute.getHilliness(climbInFeet, distanceInMiles, baseSpeed);
        return distanceInMiles / effectiveSpeed;     // hours
    }

    static getHilliness(climbInFeet, distanceInMiles, baseSpeed) {
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
        return effectiveSpeed;
    }

    static addToForecast(trackPoint, currentTime, elapsedTimeInHours, distanceInMiles, isControl) {
        return {lat:trackPoint.lat,lon:trackPoint.lon,distance:Math.round(distanceInMiles),
            time:currentTime.plus({hours:elapsedTimeInHours}).toFormat("yyyy-MM-dd'T'HH:mm:00ZZZ"), isControl:isControl};
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

    adjustForWind = (forecastInfo,stream,pace,controls,previouslyCalculatedValues,start,finishTime,timeZoneId) => {
        if (forecastInfo.length===0) {
            return {time:0,values:[],gustSpeed:0,finishTime:finishTime};
        }

        const gustThreshold = 50;   // above this incorporate some of the gust into the effect on the rider
        let baseSpeed = inputPaceToSpeed[pace];
        let forecast = forecastInfo.slice().reverse();
        let currentForecast = forecast.pop();
        let currentControl = 0;
        let previousPoint = null;
        let previousPoints = [];
        let totalMinutesLost = 0;
        let totalDistanceInKm = 0;
        let accumulatedClimbMeters = 0;
        let calculatedValues = [];
        let maxGustSpeed = 0;
        let adjustedTimes = []
        let forecastIndex = 1

        stream.filter(point => point != null && point.lat !== undefined && point.lon !== undefined).forEach(currentPoint => {
            if (previousPoint !== null) {
                let deltas = this.findDeltas(previousPoint,currentPoint);
                totalDistanceInKm += deltas.distance;
                // accumulate elevation gain
                accumulatedClimbMeters += deltas.climb;

                let distanceInMiles = deltas.distance*kmToMiles;
                if (distanceInMiles === 0) {
                    return;
                }
                // get current forecast
                if (forecast.length > 0 && (totalDistanceInKm*kmToMiles)>forecast[forecast.length-1].distance) {
                    currentForecast = forecast.pop();
                    // calculate adjusted forecast time for table display purposes
                    const initialForecastTime = DateTime.fromFormat(currentForecast.fullTime, 'EEE MMM d h:mma yyyy');
                    adjustedTimes.push({time:initialForecastTime.plus({minutes:totalMinutesLost}),index:forecastIndex})
                    forecastIndex++
                }
                // get bearing between the two points
                let trackBearing = AnalyzeRoute.getRelativeBearing(previousPoint,currentPoint);
                let relativeBearing = AnalyzeRoute.getBearingBetween(trackBearing,currentForecast.windBearing);
                // adjust speed
                let averageWindSpeed = parseInt(currentForecast.windSpeed);
                if (currentForecast.gust !== undefined) {
                    let gustSpeed = parseInt(currentForecast.gust);
                    if (gustSpeed > maxGustSpeed) {
                        maxGustSpeed = gustSpeed;
                    }
                    if (gustSpeed > gustThreshold) {
                        averageWindSpeed += (gustSpeed - averageWindSpeed)/2;
                    }
                }
                let effectiveWindSpeed = Math.cos((Math.PI / 180)*relativeBearing)*averageWindSpeed;
                let effectiveCrosswind = Math.sin((Math.PI / 180)*relativeBearing)*averageWindSpeed
                // sometimes the route data is missing elevation, so don't try to compute with it
                if (previousPoint.elevation!==undefined && currentPoint.elevation!==undefined) {
                    let grade = this.getGrade(previousPoints, currentPoint);
                    if (grade < 0) {
                        grade = 0;
                    }
                    let effectiveSpeed = baseSpeed;
                    if (totalDistanceInKm > 0) {
                        effectiveSpeed = AnalyzeRoute.getHilliness(accumulatedClimbMeters* 3.2808, totalDistanceInKm*kmToMiles, baseSpeed);
                    }
                    const power = getPowerOrVelocity(deltas.distance, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                        grade, 0, undefined, effectiveSpeed);
                    const modifiedVelocity = getPowerOrVelocity(deltas.distance, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                        grade, effectiveWindSpeed, power, effectiveSpeed);
                    // console.info(`grade was ${grade} power was ${power} wind:${effectiveWindSpeed} speed:${effectiveSpeed} modifiedVelocity was ${modifiedVelocity}`);
                    totalMinutesLost += AnalyzeRoute.windToTimeInMinutes(effectiveSpeed, distanceInMiles, modifiedVelocity);
                }

                let desiredDistance = totalDistanceInKm*kmToMiles;   // because the controls always use miles internally
                currentControl = AnalyzeRoute.calculateValuesForWind(controls, previouslyCalculatedValues,
                    calculatedValues, currentControl, desiredDistance, totalMinutesLost, start, totalDistanceInKm*kmToMiles, timeZoneId);
            }
            previousPoint = currentPoint;
            previousPoints.push(currentPoint);
        });

        calculatedValues.sort((a,b) => a.val-b.val);
        // in case there is one more forecast line to update
        if (forecast.length > 0) {
            currentForecast = forecast.pop();
            // calculate adjusted forecast time for table display purposes
            const initialForecastTime = DateTime.fromFormat(currentForecast.fullTime, 'EEE MMM d h:mma yyyy');
            adjustedTimes.push({time:initialForecastTime.plus({minutes:totalMinutesLost}),index:forecastIndex})
        }
        return {time:totalMinutesLost,values:calculatedValues, gustSpeed:maxGustSpeed,
                finishTime:DateTime.fromFormat(finishTime,finishTimeFormat).plus({minutes:totalMinutesLost}).toFormat(finishTimeFormat),
                adjustedTimes:adjustedTimes
            };
    };

    static calculateValuesForWind(controls, previouslyCalculatedValues,
                                  calculatedValues, currentControl, desiredDistance,
                                  totalMinutesLost, start, totalDistanceInMiles, timeZoneId) {
        if (controls.length > currentControl) {
            if (desiredDistance >= controls[currentControl].distance) {
                // console.info(`updating control ${currentControl} with delay ${totalMinutesLost} minutes`);
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
