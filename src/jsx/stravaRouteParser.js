import queryString from 'query-string';
import moment from 'moment';
import strava from 'strava-v3-alpaca'
import cookie from 'react-cookies';
import {paceToSpeed} from './ui/ridingPace';

const metersToMiles = 0.00062137;
const metersToFeet = 3.2808;

class StravaRouteParser {
    constructor() {
        this.processActivityStream = this.processActivityStream.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
    }

    fetchStravaActivity(activityId, token) {
        if (token === null) {
            StravaRouteParser.authenticate(activityId);
            return new Promise((resolve, reject) => reject(new Error('fetching authentication token')));
        }
        let activityPromise = this.fetchActivity(activityId, token);
        return new Promise((resolve, reject) => {
            activityPromise.then(activityData => {
                    let activityDataPromise = this.processActivityStream(activityId,token);
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
        return moment(activity['start_date']).add(activity['elapsed_time'],'seconds').format('ddd, MMM DD h:mma');
    }

    fetchActivity(activityId, token) {
        return new Promise((resolve, reject) => {
            strava.activities.get({access_token: token, id: activityId},
                function (err, payload) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(payload);
                    }
                }
            );
        });
    }

    findMovingAverages(activity,activityStreams,intervalInHours) {
        const min_speed = 1.3;  // m/s for 3pmh

        let start = moment(activity.start_date);
        let intervalInSeconds = intervalInHours * 3600;
        let distances = activityStreams.filter(stream => stream.type === 'distance')[0].data;
        let times = activityStreams.filter(stream => stream.type === 'time')[0].data;
        let altitudes = activityStreams.filter(stream => stream.type === 'altitude')[0].data;
        let speeds = activityStreams.filter(stream => stream.type === 'velocity_smooth')[0].data;

        let index = 0;
        let startingDistanceMeters = 0;
        let lastMovingTimeSeconds = null;
        let intervalMovingTimeSeconds = 0;
        let intervalStartTimeSeconds = 0;
        let isMoving = speeds[0] >= min_speed;
        let intervalElevationGainMeters = 0;
        let lastElevation = null;
        let averages = [];

        const addToAverages = function (intervalStartTimeSeconds, startingDistanceMeters, distance,
                                        lastMovingTimeSeconds, value, movingNow) {
            // compute average, set up for next interval
            let currentMoment = moment(start).add(intervalStartTimeSeconds, 'seconds');
            let distanceTraveledMeters = distance - startingDistanceMeters;
            let distanceTraveledMiles = distanceTraveledMeters * metersToMiles;
            // regardless of whether we're moving at this point, sum up the moving time
            if (movingNow) {
                intervalMovingTimeSeconds += (value - lastMovingTimeSeconds);
            }
            let movingAverage = (distanceTraveledMiles) / (intervalMovingTimeSeconds / 3600);
            let climbInFeet = intervalElevationGainMeters * metersToFeet;
            let pace = StravaRouteParser.wwPaceCalc(climbInFeet, distanceTraveledMiles, movingAverage);
            return ({
                speed: movingAverage, distance: distanceTraveledMiles, climb: climbInFeet,
                start:startingDistanceMeters, end:distance,
                pace: pace, alphaPace: StravaRouteParser.getAlphaPace(Math.round(pace)), time: currentMoment.format('ddd, MMM DD h:mma')
            });
        };

        for (let value of times) {
            if (speeds[index] >= min_speed && !isMoving) {
                lastMovingTimeSeconds = value;
                isMoving = true;
            } else if (speeds[index] < min_speed && isMoving) {
                intervalMovingTimeSeconds += (value - lastMovingTimeSeconds);
                isMoving = false;
            }
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
            if (isMoving && ((value - lastMovingTimeSeconds) + intervalMovingTimeSeconds) >= intervalInSeconds) {
                averages.push(addToAverages(intervalStartTimeSeconds,startingDistanceMeters,distances[index],
                    lastMovingTimeSeconds,value,speeds[index] >= min_speed));
                intervalMovingTimeSeconds = 0;
                intervalStartTimeSeconds = value;
                startingDistanceMeters = distances[index];
                intervalElevationGainMeters = 0;
                lastMovingTimeSeconds = value;
            }
            ++index;
        }
        if (intervalMovingTimeSeconds > 0) {
            averages.push(addToAverages(intervalStartTimeSeconds,startingDistanceMeters,distances[distances.length-1],
                lastMovingTimeSeconds,times[times.length-1],speeds[speeds.length-1]>= min_speed));
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
        let startMoment = moment(start);
        let controlsCopy = controlPoints.slice();
        let currentControl = controlsCopy.shift();
        let index = 0;
        for (let value of distance) {
            let distanceInMiles = value * metersToMiles;
            if (distanceInMiles >= currentControl.distance) {
                let currentMoment = moment(startMoment).add(time[index],'seconds');
                arrivalTimes.push({time:currentMoment.format('ddd, MMM DD h:mma'),val:currentControl.id});
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
        let distances = activityStream.filter(stream => stream.type === 'distance')[0].data;
        let times = activityStream.filter(stream => stream.type === 'time')[0].data;
        StravaRouteParser.walkActivity(activity['start_date'], distances, times, modifiedControls,arrivalTimes);
        arrivalTimes.sort((a,b) => a['val']-b['val']);
        return arrivalTimes;
    }

    processActivityStream(activityId,token) {
        const promise = new Promise((resolve, reject) =>
        {
            strava.streams.activity({access_token:token, id:activityId, types:'distance,time,altitude,velocity_smooth,latlng'},
                function(err,payload)
                {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(payload);
                    }
                }
            );
        }
        );
        return promise;
    }

    static authenticate(activityId) {
        let params = queryString.parse(location.search);
        params['strava_activity'] = activityId;
        params['strava_analysis'] = true;
        window.location.href = '/stravaAuthReq?state=' + JSON.stringify(params);
    }
}

export default new StravaRouteParser();
