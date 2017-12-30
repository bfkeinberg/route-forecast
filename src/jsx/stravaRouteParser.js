import queryString from 'query-string';
import moment from 'moment';
import strava from 'strava-v3'
import cookie from 'react-cookies';

const metersToMiles = 0.00062137;

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

    computeActualTimes(activityId, controlPoints, errorCallback) {
        if (!this.authenticated) {
            StravaRouteParser.authenticate(activityId);
            return;
        }
        this.updateProgress(true);
        let activityPromise = this.fetchActivity(activityId);
        activityPromise.then(activityData =>
        {
            let activityDataPromise = this.processActivityStream(activityId);
            activityDataPromise.then(activityStream =>
                {
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
                    this.updateControls(this.parseActivity(activityData, activityStream, controlPoints), this.computeActualFinishTime(activityData));
                }, error => {
                    if (errorCallback !== undefined) {
                        errorCallback(error);
                    } else {
                        console.log('Failed to load Strava activity stream', error);
                    }
                }
            );
        }, error => {
            if (errorCallback !== undefined) {
                if (error.msg !== undefined) {
                    errorCallback(error.msg);
                } else {
                    errorCallback(error);
                }
            } else {
                console.log('Failed to load Strava activity data', error);
            }
        });
    }

    computeActualFinishTime(activity) {
        return moment(activity['start_date']).add(activity['elapsed_time'],'seconds').format('ddd, MMM DD h:mma');
    }

    fetchActivity(activityId) {
        const promise = new Promise((resolve, reject) => {
            strava.activities.get({access_token: this.token, id: activityId},
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

    static walkActivity(start, distance, time, controlPoints) {
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

    processActivityStream(activityId, controlPoints) {
        const promise = new Promise((resolve, reject) =>
        {
            strava.streams.activity({access_token:this.token, id:activityId, types:'distance,time'},
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