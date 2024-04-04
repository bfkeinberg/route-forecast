import { DateTime } from 'luxon';
import queryString from 'query-string';
import cookie from 'react-cookies';
import { Api } from 'rest-api-handler';

import { paceToSpeed, setMinMaxCoords } from './util';

const metersToMiles = 0.00062137;
const metersToFeet = 3.2808;

class StravaActivityParser {
    constructor() {
        this.processActivityStream = this.processActivityStream.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
        this.api = new Api('https://www.strava.com/api/v3', [(response) => Promise.resolve(response.json())]);
    }

    fetchStravaActivity(activityId, token) {
        if (token === null) {
            this.authenticate(activityId);
            return new Promise((resolve, reject) => reject(new Error('fetching authentication token')));
        }
        this.api.setDefaultHeader('Authorization', `Bearer ${token}`);
        let activityPromise = this.fetchActivity(activityId, this.api);
        return new Promise((resolve, reject) => {
            activityPromise.then(activityData => {
                let activityDataPromise = this.processActivityStream(activityId, this.api);
                activityDataPromise.then(activityStream => {
                    if (activityData.message !== undefined) {
                        if (activityData.message !== "Record Not Found") {
                            cookie.remove('strava_token');
                        }
                        reject(activityData.message);
                        return;
                    }
                    if (activityStream.message !== undefined) {
                        if (activityStream.message !== "Record Not Found") {
                            cookie.remove('strava_token');
                        }
                        reject(activityStream.message);
                        return;
                    }
                    resolve({ activity: activityData, stream: activityStream });
                }, error => {
                    reject(error);
                });
            }, error => {
                reject(error);
            });
        });
    }

    computeControlPointArrivalTimes = (activityData, activityStream, controlPoints) => {
        let arrivalTimes = [];
        let modifiedControls = controlPoints.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        let distances = activityStream.distance.data;
        let times = activityStream.time.data;
        StravaActivityParser.walkActivity(activityData['start_date'], distances, times, modifiedControls, arrivalTimes);
        arrivalTimes.sort((a,b) => a['val']-b['val']);
        return arrivalTimes;
    }

    computeActualFinishTime = activityData => DateTime.fromISO(activityData['start_date']).plus({seconds:activityData['elapsed_time']}).toFormat('MMMM dd, yyyy h:mm a');

    computeWWPaceForActivity = activityData => {
        // all below in meters
        let average_speed_in_meters = activityData.average_speed;
        let averageSpeedInMilesPerHour = (average_speed_in_meters*3600)*metersToMiles;
        let climbInMeters = activityData.total_elevation_gain;
        let distanceInMeters = activityData.distance;
        let climbInFeet = (climbInMeters * metersToFeet);
        let distanceInMiles = distanceInMeters*metersToMiles;
        return StravaActivityParser.wwPaceCalc(climbInFeet, distanceInMiles, averageSpeedInMilesPerHour);
    }

    static wwPaceCalc(climbInFeet, distanceInMiles, averageSpeedInMilesPerHour) {
        let hilliness = (climbInFeet / distanceInMiles) / 25;
        return averageSpeedInMilesPerHour + hilliness;
    }

    computePointsAndBounds = (activityStream) => {
        let latlng = activityStream.latlng;
        let distance = activityStream.distance;
        let bounds = { min_latitude: 90, min_longitude: 180, max_latitude: -90, max_longitude: -180 };
        return {
            pointList: latlng.data.map((coord, i) => {
                let point = Object.assign({}, {lat:coord[0], lon:coord[1]}, {dist:distance.data[i]});
                bounds = setMinMaxCoords(point, bounds);
                return point
            }),
            bounds
        };
    };

    fetchActivity(activityId, api) {
        return api.get(`/activities/${activityId}`);
    }

    findMovingAverages(activity,activityStreams,intervalInHours) {
        let start = DateTime.fromISO(activity.start_date);
        let intervalInSeconds = intervalInHours * 3600;
        let distances = activityStreams.distance.data;
        let times = activityStreams.time.data;
        let altitudes = activityStreams.altitude.data;

        let index = 0;
        let startingDistanceMeters = 0;
        let intervalStartTimeSeconds = 0;
        let intervalElevationGainMeters = 0;
        let lastElevation = null;
        let averages = [];

        const addToAverages = function (intervalStartTimeSeconds, startingDistanceMeters, distance,
                                        intervalMovingTimeSeconds, value, stoppedTimeSeconds) {
            // compute average, set up for next interval
            let currentMoment = start.plus({seconds:intervalStartTimeSeconds});
            let distanceTraveledMeters = distance - startingDistanceMeters;
            let distanceTraveledMiles = distanceTraveledMeters * metersToMiles;
            let movingAverage = (distanceTraveledMiles) / (intervalMovingTimeSeconds / 3600);
            let climbInFeet = intervalElevationGainMeters * metersToFeet;
            let pace = StravaActivityParser.wwPaceCalc(climbInFeet, distanceTraveledMiles, movingAverage);
            return ({
                speed: movingAverage, distance: distanceTraveledMiles, climb: climbInFeet,
                start:startingDistanceMeters, end:distance,
                pace: pace, alphaPace: StravaActivityParser.getAlphaPace(Math.round(pace)),
                time: currentMoment.toFormat('EEE, MMM dd h:mma'), stoppedTimeSeconds: stoppedTimeSeconds
            });
        };

        const moving = activityStreams.moving.data;
        let prevTime = 0;
        let movingTimeSeconds = 0;
        let stoppedTimeSeconds = 0;
        for (let value of times) {
            if (moving[index]) {
                movingTimeSeconds += value - prevTime;
            } else {
                stoppedTimeSeconds += value - prevTime;
            }
            prevTime = value;
            // try to apply some smoothing to elevation gain
            if (lastElevation !== null) {
                if (altitudes[index] > (lastElevation + 0.2)) {
                    intervalElevationGainMeters += (altitudes[index] - lastElevation);
                }
                else if (altitudes[index] > (lastElevation + 0.1)) {
                    intervalElevationGainMeters += (altitudes[index] - lastElevation)/2;
                }
            }
            lastElevation = altitudes[index];
            // only calculate speed while we are moving, and determine the moving time by adding moving time
            // in the interval up until now, and add in the time since we started moving most recently
            if (moving[index] && movingTimeSeconds >= intervalInSeconds) {
                averages.push(addToAverages(intervalStartTimeSeconds, startingDistanceMeters, distances[index],
                                            movingTimeSeconds, value, stoppedTimeSeconds));
                intervalStartTimeSeconds = value;
                startingDistanceMeters = distances[index];
                intervalElevationGainMeters = 0;
                movingTimeSeconds = 0;
                stoppedTimeSeconds = 0;
            }
            ++index;
        }
        if (movingTimeSeconds > 0) {
            averages.push(addToAverages(intervalStartTimeSeconds,startingDistanceMeters,distances[distances.length-1],
                                        movingTimeSeconds, times[times.length-1], stoppedTimeSeconds));
        }
        return averages;
    }

    static getAlphaPace(pace) {
        let alpha = 'A-';     // default
        alpha = Object.keys(paceToSpeed).reverse().find(value => {
            return (pace >= paceToSpeed[value])});
        return alpha;
    }

    static walkActivity(start, distance, time, controlPoints, arrivalTimes) {
        if (controlPoints.length === 0) {
            return;
        }
        let startMoment = DateTime.fromISO(start);
        let controlsCopy = controlPoints.slice();
        let currentControl = controlsCopy.shift();
        let index = 0;
        for (let value of distance) {
            let distanceInMiles = value * metersToMiles;
            if (distanceInMiles >= currentControl.distance) {
                let currentMoment = startMoment.plus({seconds:time[index]});
                arrivalTimes.push({time:currentMoment.toFormat('EEE, MMM dd h:mma'),val:currentControl.id});
                if (controlsCopy.length===0) {
                    return;
                } else {
                    currentControl = controlsCopy.shift();
                }
            }
            index++;
        }
    }

    processActivityStream(activityId,api) {
        return api.get(`activities/${activityId}/streams?keys=distance,time,altitude,velocity_smooth,moving,latlng&key_by_type=true`);
    }

    authenticate(activityId) {
        let params = queryString.parse(location.search);
        params['strava_activity'] = activityId;
        params['strava_analysis'] = true;
        window.location.href = '/stravaAuthReq?state=' + encodeURIComponent(JSON.stringify(params));
    }
}

export default new StravaActivityParser();
