import queryString from 'query-string';
import { Api } from 'rest-api-handler';
import cookie from 'react-cookies';
import {paceToSpeed} from './ui/ridingPace';
import { DateTime } from 'luxon';

const metersToMiles = 0.00062137;
const metersToFeet = 3.2808;

class StravaRouteParser {
    constructor() {
        this.processActivityStream = this.processActivityStream.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
        this.api = new Api('https://www.strava.com/api/v3', [(response) => Promise.resolve(response.json())]);
    }

    fetchStravaActivity(activityId, token) {
        if (token === null) {
            StravaRouteParser.authenticate(activityId);
            return new Promise((resolve, reject) => reject(new Error('fetching authentication token')));
        }
        this.api.setDefaultHeader('Authorization', `Bearer ${token}`);
        let activityPromise = this.fetchActivity(activityId, this.api);
        return new Promise((resolve, reject) => {
            activityPromise.then(activityData => {
                    let activityDataPromise = this.processActivityStream(activityId, this.api);
                    activityDataPromise.then(activityStream => {
                            if (activityData.message !== undefined) {
                                cookie.remove('strava_token');
                                reject(activityData.message);
                                return;
                            }
                            if (activityStream.message !== undefined) {
                                cookie.remove('strava_token');
                                reject(activityStream.message);
                                return;
                            }
                            resolve({activity: activityData, stream: activityStream});
                        }, error => {
                            reject(error);
                        }
                    );
                }, error => {
                    reject(error);
                }
            );
        });
    }

    computeTimesFromData = (controlPoints, activityData, activityStream) => {
        return ({controls:this.parseActivity(activityData, activityStream, controlPoints),
            actualFinishTime:StravaRouteParser.computeActualFinishTime(activityData),
            actualPace:StravaRouteParser.wwPaceCalcForActivity(activityData)});
    };

    static wwPaceCalcForActivity(activity) {
        // all below in meters
        let average_speed_in_meters = activity.average_speed;
        let averageSpeedInMilesPerHour = (average_speed_in_meters*3600)*metersToMiles;
        let climbInMeters = activity.total_elevation_gain;
        let distanceInMeters = activity.distance;
        let climbInFeet = (climbInMeters * metersToFeet);
        let distanceInMiles = distanceInMeters*metersToMiles;
        return StravaRouteParser.wwPaceCalc(climbInFeet, distanceInMiles, averageSpeedInMilesPerHour);
    }

    static wwPaceCalc(climbInFeet, distanceInMiles, averageSpeedInMilesPerHour) {
        let hilliness = (climbInFeet / distanceInMiles) / 25;
        return averageSpeedInMilesPerHour + hilliness;
    }

    static computeActualFinishTime(activity) {
            return DateTime.fromISO(activity['start_date']).plus({seconds:activity['elapsed_time']}).toFormat('EEE, MMM dd h:mma');
    }

    fetchActivity(activityId, api) {
        return api.get(`/activities/${activityId}`);
    }

    findMovingAverages(activity,activityStreams,intervalInHours) {
        let start = DateTime.fromISO(activity.start_date);
        let intervalInSeconds = intervalInHours * 3600;
        let distances = activityStreams.distance.data;
        let times = activityStreams.time.data;
        let altitudes = activityStreams.altitude.data;
        let speeds = activityStreams.velocity_smooth.data;

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
            let pace = StravaRouteParser.wwPaceCalc(climbInFeet, distanceTraveledMiles, movingAverage);
            return ({
                speed: movingAverage, distance: distanceTraveledMiles, climb: climbInFeet,
                start:startingDistanceMeters, end:distance,
                pace: pace, alphaPace: StravaRouteParser.getAlphaPace(Math.round(pace)),
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

    parseActivity(activity, activityStream, controlPoints) {
        let arrivalTimes = [];
        let modifiedControls = controlPoints.slice();
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        let distances = activityStream.distance.data;
        let times = activityStream.time.data;
        StravaRouteParser.walkActivity(activity['start_date'], distances, times, modifiedControls, arrivalTimes);
        arrivalTimes.sort((a,b) => a['val']-b['val']);
        return arrivalTimes;
    }

    processActivityStream(activityId,api) {
        return api.get(`activities/${activityId}/streams?keys=distance,time,altitude,velocity_smooth,moving,latlng&key_by_type=true`);
    }

    static authenticate(activityId) {
        let params = queryString.parse(location.search);
        params['strava_activity'] = activityId;
        params['strava_analysis'] = true;
        window.location.href = '/stravaAuthReq?state=' + JSON.stringify(params);
    }
}

export default new StravaRouteParser();
