const gpxParse = require("gpx-parse-alpaca");
import moment from 'moment-timezone';
// import 'whatwg-fetch';
import {finishTimeFormat} from './reducers/reducer';

import {paceToSpeed} from "./ui/ridingPace";
import {getPowerOrVelocity} from "./windUtils";

const kmToMiles = 0.62137;

class AnalyzeRoute {
    constructor() {
        this.walkRwgpsRoute = this.walkRwgpsRoute.bind(this);
        this.walkGpxRoute = this.walkGpxRoute.bind(this);
        this.loadRwgpsRoute = this.loadRwgpsRoute.bind(this);
        this.loadGpxFile = this.loadGpxFile.bind(this);
        this.analyzeRoute = this.analyzeRoute.bind(this);
    }

    loadGpxFile(gpxFile) {
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
                    resolve(gpxData);
                }, error => {
                    reject(error);      // error parsing gpx
                });
            }, error => {
                reject(error);      // errors in reading the file
            });
        });
    }

    // returns distance traveled in _miles_, and climb in meters
    findDeltas(previousPoint, currentPoint) {
        // calculate distance and elevation from last
        let distanceFromLast = gpxParse.utils.calculateDistance(previousPoint.lat, previousPoint.lon,
            currentPoint.lat,currentPoint.lon);
        if (currentPoint.elevation > previousPoint.elevation) {
            return {distance:distanceFromLast,climb:currentPoint.elevation-previousPoint.elevation};
        } else {
            return {distance:distanceFromLast,climb:0};
        }
    }

    loadRwgpsRoute(route, isTrip) {
        return new Promise((resolve, reject) => {
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
                    return;
                }
                resolve(response);
            },
            error => {
                reject(error.message);
            });
        });
    }

    analyzeRoute(trackName, stream, userStartTime, pace, intervalInHours, controls, metric, timeZoneId) {

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
            let arrivalTime = moment(startTime).add(elapsedTimeInHours,'hours');
            let banked = Math.round(AnalyzeRoute.rusa_time(distanceInKm, elapsedTimeInHours));
            calculatedValues.push({arrival:arrivalTime.format(finishTimeFormat),
                banked: banked,
                val:controls[nextControl].id, lat:point.lat, lon:point.lon
            });
            nextControl++;
            return delayInMinutes/60;      // convert from minutes to hours
        };

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
        let calculatedValues = [];
        let lastTime = 0;
        // correct start time for time zone
        let startTime = moment.tz(userStartTime.format('YYYY-MM-DDTHH:mm'), timeZoneId);
        let bearings = [];
        stream.filter(point => point.lat!==undefined && point.lon!==undefined).forEach(point => {
            bounds = AnalyzeRoute.setMinMaxCoords(point,bounds);
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
                accumulatedTime = AnalyzeRoute.calculateElapsedTime(accumulatedClimbMeters, accumulatedDistanceKm, baseSpeed);
            }
            idlingTime += checkAndUpdateControls(accumulatedDistanceKm, startTime, (accumulatedTime + idlingTime),
                controls, calculatedValues, metric, point);
            // see if it's time for forecast
            if (((accumulatedTime + idlingTime) - lastTime) >= intervalInHours) {
                forecastRequests.push(AnalyzeRoute.addToForecast(point, startTime, (accumulatedTime + idlingTime),
                    accumulatedDistanceKm * kmToMiles));
                lastTime = accumulatedTime + idlingTime;
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
            points:stream,name:trackName,values:calculatedValues,
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

    static fillLastControlPoint(finishTime, controls, nextControl, totalTime, totalDistanceInKm, calculatedValues) {
        while (nextControl < controls.length)   {
            // update banked time also, supplying final distance in km and total time taken
            let banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInKm, totalTime));
            calculatedValues.push({arrival:finishTime,banked:banked,val:controls[nextControl].distance});
            ++nextControl;
        }
    }

    static formatFinishTime(startTime,accumulatedTime,restTime) {
        return moment(startTime).add(accumulatedTime+restTime,'hours').format(finishTimeFormat);
    }

    walkRwgpsRoute(routeData,startTime,pace,interval,controls,metric,timeZoneId) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        let stream = routeData[routeData.type]['track_points'].map(point => ({lat:point.y,lon:point.x,elevation:point.e, dist:point.d}));
        let trackName = routeData[routeData.type].name;
        return this.analyzeRoute(trackName, stream, startTime, pace, interval, modifiedControls, metric, timeZoneId);
    }

    walkGpxRoute(routeData,startTime,pace,interval,controls,metric,timeZoneId) {
        let modifiedControls = controls.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        let stream = routeData.tracks.reduce((accum,current) => accum.concat(current.segments.reduce((accum,current) => accum.concat(current),[])),[]);
        let trackName = routeData.tracks[0].name;
        return this.analyzeRoute(trackName, stream, startTime, pace, interval, modifiedControls, metric, timeZoneId);
    }

    findTimezoneForPoint(lat, lon, time, maps_api_key) {
        return fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${time.format("X")}&key=${maps_api_key}`).then( response => {
            if (response.ok) {
                return response.json();
            }
            throw Error(response.error());
        }).then (body => {
            // determine total timezone offset in seconds
            let tzOffset = body.dstOffset + body.rawOffset;
            return ({offset:tzOffset,zoneId:body.timeZoneId});
        });
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
        let hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
        return distanceInMiles / (baseSpeed - hilliness);     // hours
    }

    static setMinMaxCoords(trackPoint,bounds) {
        bounds.min_latitude = Math.min(trackPoint.lat, bounds.min_latitude);
        bounds.min_longitude = Math.min(trackPoint.lon, bounds.min_longitude);
        bounds.max_latitude = Math.max(trackPoint.lat, bounds.max_latitude);
        bounds.max_longitude = Math.max(trackPoint.lon, bounds.max_longitude);
        return bounds;
    }

    static addToForecast(trackPoint, currentTime, elapsedTimeInHours, distance) {
        return {lat:trackPoint.lat,lon:trackPoint.lon,distance:Math.round(distance),
            time:moment(currentTime).add(elapsedTimeInHours,'hours').format('YYYY-MM-DDTHH:mm:00ZZ')};
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

    adjustForWind = (forecastInfo,stream,pace,controls,previouslyCalculatedValues,start,metric,finishTime) => {
        if (forecastInfo.length===0) {
            return {time:0,values:[],gustSpeed:0,finishTime:finishTime};
        }
        let baseSpeed = paceToSpeed[pace];
        let forecast = forecastInfo.slice().reverse();
        let currentForecast = forecast.pop();
        let currentControl = 0;
        let previousPoint = null;
        let totalMinutesLost = 0;
        let totalDistanceInKm = 0;
        let calculatedValues = [];
        let maxGustSpeed = 0;

        stream.filter(point => point.lat !== undefined && point.lon !== undefined).forEach(currentPoint => {
            if (previousPoint !== null) {
                let distanceInKm = gpxParse.utils.calculateDistance(previousPoint.lat, previousPoint.lon,
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

                const power = getPowerOrVelocity(distanceInKm, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                    0, 0, undefined, baseSpeed);
                const modifiedVelocity = getPowerOrVelocity(distanceInKm, Math.abs(previousPoint.elevation-currentPoint.elevation)/2,
                    0, effectiveWindSpeed, power, baseSpeed);
                totalMinutesLost += AnalyzeRoute.windToTimeInMinutes(baseSpeed, distanceInMiles, modifiedVelocity);

                let desiredDistance = metric ? totalDistanceInKm: totalDistanceInKm*kmToMiles;
                currentControl = AnalyzeRoute.calculateValuesForWind(controls, previouslyCalculatedValues,
                    calculatedValues, currentControl,
                    desiredDistance, totalMinutesLost, start, totalDistanceInKm*kmToMiles);
            }
            previousPoint = currentPoint;
        });

        return {time:totalMinutesLost,values:calculatedValues, gustSpeed:maxGustSpeed,
            finishTime:moment(finishTime,finishTimeFormat).add(totalMinutesLost,'minutes').format(finishTimeFormat)};
    };

    static calculateValuesForWind(controls, previouslyCalculatedValues,
                                  calculatedValues, currentControl, desiredDistance,
                                  totalMinutesLost, start, totalDistanceInMiles) {
        if (controls.length > currentControl) {
            if (desiredDistance >= controls[currentControl].distance) {
                let previousArrivalTime = moment(previouslyCalculatedValues[currentControl].arrival, finishTimeFormat);
                let arrivalTime = previousArrivalTime.add(totalMinutesLost, 'minutes');
                let elapsedTimeMs = arrivalTime.toDate() - start;
                let elapsedDuration = moment.duration(elapsedTimeMs, 'ms');
                let banked = Math.round(AnalyzeRoute.rusa_time(totalDistanceInMiles / kmToMiles, elapsedDuration.asHours()));
                calculatedValues.push({...previouslyCalculatedValues[currentControl], arrival:arrivalTime.format(finishTimeFormat),banked:banked});

                currentControl++;
            }
        }
        return currentControl;
    }
}

export default new AnalyzeRoute();
