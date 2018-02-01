import queryString from 'query-string';
import moment from 'moment';
import strava from 'strava-v3'
import cookie from 'react-cookies';
import {paceToSpeed} from './routeInfoEntry';

const metersToMiles = 0.00062137;
const metersToFeet = 3.2808;

class StravaRouteParser {
    constructor(updateControls,updateProgress) {
        this.authenticated = false;
        this.processActivityStream = this.processActivityStream.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
        this.setToken = this.setToken.bind(this);
        this.updateControls = updateControls;
        this.updateProgress = updateProgress;
    }

    setToken(token) {
        if (token === undefined) {
            return;
        }
        this.token = token;
        this.authenticated = true;
    }

    computeActualTimes(activityId, controlPoints, token) {
        if (token === null) {
            StravaRouteParser.authenticate(activityId);
            return;
        }
        this.updateProgress(true);
        let activityPromise = this.fetchActivity(activityId, token);
        return new Promise((resolve, reject) => {
            activityPromise.then(activityData => {
                let activityDataPromise = this.processActivityStream(activityId);
                activityDataPromise.then(activityStream => {
                        this.updateProgress(false);
                        if (activityData.message !== undefined) {
                            cookie.remove('strava_token');
                            errorCallback(activityData.message);
                            return;
                        }
                        if (activityStream.message !== undefined) {
                            cookie.remove('strava_token');
                            errorCallback(activityStream.message);
                            return;
                        }
                        console.log(this.findMovingAverage(activityData, activityStream, 4));
                        resolve(this.updateControls(this.parseActivity(activityData, activityStream, controlPoints),
                            this.computeActualFinishTime(activityData), StravaRouteParser.wwPaceCalcForActivity(activityData)));
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

    findMovingAverage(activity,activityStreams,intervalInHours) {
        let start = moment(activity['start_date']);
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

    static walkActivity(start, distance, time, controlPoints) {
        if (controlPoints.length === 0) {
            return;
        }
        let startMoment = moment(start);
        let controlsCopy = controlPoints.slice();
        let currentControl = controlsCopy.shift();
        let index = 0;
        for (let value of distance) {
            let distanceInMiles = value * metersToMiles;
            if (distanceInMiles >= currentControl['distance']) {
                let currentMoment = moment(startMoment).add(time[index],'seconds');
                currentControl['actual'] = currentMoment.format('ddd, MMM DD h:mma');
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
        let modifiedControls = controlPoints.map(control => Object.assign({}, control));
        modifiedControls.sort((a,b) => a['distance']-b['distance']);
        if (activityStream[0].type==='distance') {
            StravaRouteParser.walkActivity(activity['start_date'], activityStream[0].data, activityStream[1].data,modifiedControls);
        } else {
            StravaRouteParser.walkActivity(activity['start_date'], activityStream[1].data, activityStream[0].data, modifiedControls);
        }
        return modifiedControls;
    }

    processActivityStream(activityId) {
        const promise = new Promise((resolve, reject) =>
        {
            strava.streams.activity({access_token:this.token, id:activityId, types:'distance,time,moving,altitude'},
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

export default StravaRouteParser;