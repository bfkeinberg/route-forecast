import queryString from 'query-string';
import moment from 'moment';
import strava from 'strava-v3'
import cookie from 'react-cookies';
import {paceToSpeed} from './ui/ridingPace';

const metersToMiles = 0.00062137;
const metersToFeet = 3.2808;

class StravaRouteParser {
    constructor() {
        this.processActivityStream = this.processActivityStream.bind(this);
        this.computeTimesFromData = this.computeTimesFromData.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
    }

    fetchStravaActivity(activityId, token) {
        if (token === null) {
            StravaRouteParser.authenticate(activityId);
            return;
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

    computeTimesFromData(controlPoints, activityData, activityStream) {
        return ({controls:this.parseActivity(activityData, activityStream, controlPoints),
            actualFinishTime:this.computeActualFinishTime(activityData),
            actualPace:StravaRouteParser.wwPaceCalcForActivity(activityData)});
    }

    computeActualTimes(activityId, controlPoints, token, beginFetch, endFetch) {
        if (token === null) {
            StravaRouteParser.authenticate(activityId);
            return;
        }
        beginFetch();
        let activityPromise = this.fetchActivity(activityId, token);
        return new Promise((resolve, reject) => {
            activityPromise.then(activityData => {
                let activityDataPromise = this.processActivityStream(activityId,token);
                activityDataPromise.then(activityStream => {
                        endFetch('');
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
                        resolve(({controls:this.parseActivity(activityData, activityStream, controlPoints),
                            actualFinishTime:this.computeActualFinishTime(activityData),
                            actualPace:StravaRouteParser.wwPaceCalcForActivity(activityData)}));
                    }, error => {
                        reject(error);
                    }
                );
            }, error => {
                reject(error);
            });
        });
    }

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
        let hilliness = Math.floor(Math.min((climbInFeet / distanceInMiles) / 25, 5));
        return averageSpeedInMilesPerHour + hilliness;
    }

    computeActualFinishTime(activity) {
        return moment(activity['start_date']).add(activity['elapsed_time'],'seconds').format('ddd, MMM DD h:mma');
    }

    fetchActivity(activityId, token) {
        const promise = new Promise((resolve, reject) => {
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
        return promise;
    }

    findMovingAverages(activity,activityStreams,intervalInHours) {
        let start = moment(activity.start_date);
        let intervalInSeconds = intervalInHours * 3600;
        let distances = activityStreams.filter(stream => stream.type === 'distance')[0].data;
        let times = activityStreams.filter(stream => stream.type === 'time')[0].data;
        let moving = activityStreams.filter(stream => stream.type === 'moving')[0].data;
        let altitudes = activityStreams.filter(stream => stream.type === 'altitude')[0].data;

        let index = 0;
        let startingDistanceMeters = 0;
        let lastMovingTimeSeconds = null;
        let intervalMovingTimeSeconds = 0;
        let intervalStartTimeSeconds = 0;
        let isMoving = false;
        let intervalElevationGainMeters = 0;
        let lastElevation = null;
        let averages = [];
        for (let value of times) {
            if (moving[index] === true && !isMoving) {
                lastMovingTimeSeconds = value;
                isMoving = true;
            } else if (moving[index] === false && isMoving) {
                intervalMovingTimeSeconds += (value - lastMovingTimeSeconds);
                isMoving = false
            }
            if (lastElevation != null && altitudes[index] > lastElevation) {
                intervalElevationGainMeters += (altitudes[index] - lastElevation);
            }
            lastElevation = altitudes[index];
            if ((value - intervalStartTimeSeconds) >= intervalInSeconds) {
                // compute average, set up for next interval
                let currentMoment = moment(start).add(intervalStartTimeSeconds,'seconds');
                let distanceTraveledMeters = distances[index] - startingDistanceMeters;
                let distanceTraveledMiles = distanceTraveledMeters*metersToMiles;
                // regardless of whether we're moving at this point, sum up the moving time
                if (moving[index]) {
                    intervalMovingTimeSeconds += (value - lastMovingTimeSeconds);
                }
                let movingAverage = (distanceTraveledMiles)/(intervalMovingTimeSeconds/3600);
                let climbInFeet = intervalElevationGainMeters*metersToFeet;
                let pace = StravaRouteParser.wwPaceCalc(climbInFeet,distanceTraveledMiles,movingAverage);
                averages.push({speed:movingAverage,distance:distanceTraveledMiles,climb: climbInFeet,
                    pace:pace, alphaPace:this.getAlphaPace(pace),time:currentMoment.format('ddd, MMM DD h:mma')});
                intervalMovingTimeSeconds = 0;
                intervalStartTimeSeconds = value;
                startingDistanceMeters = distances[index];
                intervalElevationGainMeters = 0;
                lastMovingTimeSeconds = value;
            }
            ++index;
        }
        return averages;
    }

    getAlphaPace(pace) {
        let alpha = 'A';     // default
        alpha = Object.keys(paceToSpeed).reverse().find(value => {
            return (pace > paceToSpeed[value])});
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
        if (activityStream[0].type==='distance') {
            StravaRouteParser.walkActivity(activity['start_date'], activityStream[0].data, activityStream[1].data,modifiedControls,arrivalTimes);
        } else {
            StravaRouteParser.walkActivity(activity['start_date'], activityStream[1].data, activityStream[0].data, modifiedControls,arrivalTimes);
        }
        arrivalTimes.sort((a,b) => a['val']-b['val']);
        return arrivalTimes;
    }

    processActivityStream(activityId,token) {
        const promise = new Promise((resolve, reject) =>
        {
            strava.streams.activity({access_token:token, id:activityId, types:'distance,time,moving,altitude'},
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
        window.location.href = '/stravaAuthReq?state=' + JSON.stringify(params);
    }
}

export default new StravaRouteParser();