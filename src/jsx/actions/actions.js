import moment from 'moment';
import cookie from 'react-cookies';
import * as Sentry from '@sentry/browser';

const sanitizeCookieName = (cookieName) => {
    return cookieName.replace(/[ =/]/,'');
};

export const saveCookie = (name,value) => {
    cookie.save(sanitizeCookieName(name),value);
};

export const loadCookie = (name) => {
    return cookie.load(sanitizeCookieName(name));
};

export const SET_RWGPS_ROUTE = 'SET_RWGPS_ROUTE';
export const setRwgpsRoute = function(route) {
    return {
        type: SET_RWGPS_ROUTE,
        route: route
    }
};

export const SET_START = 'SET_START';
export const setStart = function (start) {
    return {
        type: SET_START,
        start: start
    }
};

export const SET_INITIAL_START = 'SET_INITIAL_START';
export const setInitialStart = function (start) {
    return {
        type: SET_INITIAL_START,
        start: start
    }
};

export const SET_PACE = 'SET_PACE';
export const setPace = function(pace) {
    return {
        type: SET_PACE,
        pace: pace
    }
};

export const SET_INTERVAL = 'SET_INTERVAL';
export const setInterval = function(interval) {
    return {
        type: SET_INTERVAL,
        interval: interval
    }
};

export const TOGGLE_ROUTE_IS_TRIP = 'TOGGLE_ROUTE_IS_TRIP';
export const toggleRouteIsTrip = function() {
    return {
        type: TOGGLE_ROUTE_IS_TRIP
    }
};

const getRouteParser = async function () {
    const parser = await import(/* webpackChunkName: "RwgpsParser" */ '../gpxParser');
    return parser.default;
};

export const BEGIN_LOADING_ROUTE = 'BEGIN_LOADING_ROUTE';
const beginLoadingRoute = function (source) {
    return {
        type: BEGIN_LOADING_ROUTE,
        source: source
    }
};

export const RWGPS_ROUTE_LOADING_SUCCESS = 'RWGPS_ROUTE_LOADING_SUCCESS';
const rwgpsRouteLoadingSuccess = function(routeData) {
    return {
        type: RWGPS_ROUTE_LOADING_SUCCESS,
        routeData : routeData
    }
};

export const RWGPS_ROUTE_LOADING_FAILURE = 'RWGPS_ROUTE_LOADING_FAILURE';
const rwgpsRouteLoadingFailure = function(status) {
    return {
        type: RWGPS_ROUTE_LOADING_FAILURE,
        status: status
    }
};

export const parseControls = function(controlPointString) {
    let controlPointList = controlPointString.split(":");
    let controlPoints =
        controlPointList.map((point,index) => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2]),id:index});
        });
    // delete dummy first element
    controlPoints.splice(0,1);
    return controlPoints;
};

const getRouteName = function(routeData) {
    if (routeData.route !== undefined) {
        return routeData.route.name;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.name;
    } else {
        return null;
    }
};

export const UPDATE_USER_CONTROLS = 'UPDATE_USER_CONTROLS';
export const updateUserControls = function(controls) {
    return {
        type: UPDATE_USER_CONTROLS,
        controls: controls
    };
};

export const UPDATE_CALCULATED_VALUES = 'UPDATE_CALCULATED_VALUES';
export const updateCalculatedValues = function(values) {
    return {
        type: UPDATE_CALCULATED_VALUES,
        values: values
    };
};

export const loadControlsFromCookie = function(routeData) {
    return function(dispatch) {
        let routeName = getRouteName(routeData);
        if (routeName !== null) {
            let savedControlPoints = loadCookie(routeName);
            if (savedControlPoints !== undefined && savedControlPoints.length > 0) {
                dispatch(updateUserControls(parseControls(savedControlPoints)));
            }
        }
    };
};

export const SET_FETCH_AFTER_LOAD = 'SET_FETCH_AFTER_LOAD';
export const setFetchAfterLoad = (fetchAfterLoad) => {return {
    type: SET_FETCH_AFTER_LOAD,
    fetchAfterLoad: fetchAfterLoad
}};

export const ADD_WEATHER_CORRECTION = 'ADD_WEATHER_CORRECTION';
export const addWeatherCorrection = function(weatherCorrection,updatedFinishTime,maxGustSpeed) {
    return {
        type: ADD_WEATHER_CORRECTION,
        weatherCorrectionMinutes: weatherCorrection,
        finishTime:updatedFinishTime,
        maxGustSpeed:maxGustSpeed
    };
};

export const BEGIN_FETCHING_FORECAST = 'BEGIN_FETCHING_FORECAST';
const beginFetchingForecast = function() {
    return {
        type: BEGIN_FETCHING_FORECAST
    }
};

export const FORECAST_FETCH_SUCCESS = 'FORECAST_FETCH_SUCCESS';
const forecastFetchSuccess = function(forecastInfo) {
    return {
        type: FORECAST_FETCH_SUCCESS,
        forecastInfo: forecastInfo
    }
};

export const FORECAST_FETCH_FAILURE = 'FORECAST_FETCH_FAILURE';
const forecastFetchFailure = function(error) {
    return {
        type: FORECAST_FETCH_FAILURE,
        error:error
    }
};

export const requestForecast = function(routeInfo) {
    return function(dispatch,getState) {
        dispatch(beginFetchingForecast());
        let formdata = new FormData();
        formdata.append('locations', JSON.stringify(routeInfo.forecastRequest));
        formdata.append('timezone', getState().routeInfo.timeZoneId);
        return fetch(getState().params.action,
            {
                method:'POST',
                body:formdata
            })
            .then(async response => {
                if (response.ok) {
                    return response.json();
                } else {
                    let details = await response.json();
                    if (details !== undefined) {
                        throw new Error(details.details);
                    }
                    let error = response.statusText !== undefined ? response.statusText : response['status'];
                    throw new Error(error);
                }
            })
            .then(async response => {
                dispatch(forecastFetchSuccess(response));
                let userControls = getState().controls.userControlPoints;
                let calculatedValues = getState().controls.initialControlValues;
                const parser = await getRouteParser();
                let {time:weatherCorrectionMinutes,values:recalculatedValues,gustSpeed,finishTime} = parser.adjustForWind(
                    response.forecast,
                    getState().routeInfo.points,
                    getState().uiInfo.routeParams.pace,
                    userControls, calculatedValues,
                    getState().uiInfo.routeParams.start,
                    getState().controls.metric,
                    getState().routeInfo.initialFinishTime);
                dispatch(addWeatherCorrection(weatherCorrectionMinutes,finishTime,gustSpeed));
                dispatch(updateCalculatedValues(recalculatedValues));
            }).catch (error => {
                let errorMessage = error.message !== undefined ? error.message : error;
                dispatch(forecastFetchFailure(errorMessage));
            }
        )
    }
};

export const SET_ROUTE_INFO = 'SET_ROUTE_INFO';
const setRouteInfo = (routeInfo) => {
    return (dispatch,getState) => {
        if (getState().routeInfo.fetchAfterLoad && routeInfo.forecastRequest !== null) {
            dispatch(requestForecast(routeInfo));
            dispatch(setFetchAfterLoad(false));
        }
        return dispatch({
            type: SET_ROUTE_INFO,
            routeInfo: routeInfo
        });
    };
};

export const SET_TIME_ZONE = 'SET_TIME_ZONE';
export const setTimeZone = function(id,offset) {
    return {
        type: SET_TIME_ZONE,
        id: id,
        offset: offset
    };
};

export const SET_ERROR_DETAILS = 'SET_ERROR_DETAILS';
export const setErrorDetails = function(details) {
    return {
        type: SET_ERROR_DETAILS,
        details: details
    };
};

export const fetchTimeZone = (point, parser, rwgpsRouteData) => {
  return (dispatch, getState) => {
      let timeZonePromise = parser.findTimezoneForPoint(point.y, point.x,
          moment(getState().uiInfo.routeParams.start), getState().params.timezone_api_key);
      return timeZonePromise.then(timeZoneResult => {
          dispatch(setTimeZone(timeZoneResult.zoneId,timeZoneResult.offset));
          dispatch(setRouteInfo(
              parser.walkRwgpsRoute(
                  rwgpsRouteData,
                  moment(getState().uiInfo.routeParams.start),
                  getState().uiInfo.routeParams.pace,
                  getState().uiInfo.routeParams.interval,
                  getState().controls.userControlPoints,
                  getState().controls.metric,
                  timeZoneResult.zoneId)));
      }, error => {
          dispatch(setErrorDetails(error));
      });
  }
};

export const INVALIDATE_FORECAST = 'INVALIDATE_FORECAST';
export const invalidateForecast = () => { return {type:INVALIDATE_FORECAST}};

export const recalcRoute = function() {
    return async function(dispatch, getState) {
        const parser = await getRouteParser();
        // need to get the time zone here, once we know our chosen start time
        // this may be called before we have chosen a route, in which case it's a noop
        let rwgpsRouteData = getState().routeInfo.rwgpsRouteData;
        if (rwgpsRouteData !== null) {
            let type = rwgpsRouteData.trip === undefined ? 'route' : 'trip';
            let rwgpsRouteDatum = rwgpsRouteData[type];
            let point = rwgpsRouteDatum['track_points'][0];
            //TODO: create another action for this section
            let timeZonePromise = parser.findTimezoneForPoint(point.y, point.x,
                moment(getState().uiInfo.routeParams.start), getState().params.timezone_api_key);
            return timeZonePromise.then(timeZoneResult => {
                dispatch(setTimeZone(timeZoneResult.zoneId,timeZoneResult.offset));
                dispatch(setRouteInfo(
                    parser.walkRwgpsRoute(
                        rwgpsRouteData,
                        moment(getState().uiInfo.routeParams.start),
                        getState().uiInfo.routeParams.pace,
                        getState().uiInfo.routeParams.interval,
                        getState().controls.userControlPoints,
                        getState().controls.metric,
                        timeZoneResult.zoneId)));
                if (getState().forecast.forecast !== []) {
                    let {time:weatherCorrectionMinutes,values:recalculatedValues,gustSpeed,finishTime} = parser.adjustForWind(
                        getState().forecast.forecast,
                        getState().routeInfo.points,
                        getState().uiInfo.routeParams.pace,
                        getState().controls.userControlPoints,
                        getState().controls.initialControlValues,
                        getState().uiInfo.routeParams.start,
                        getState().controls.metric,
                        getState().routeInfo.initialFinishTime);
                    dispatch(addWeatherCorrection(weatherCorrectionMinutes,finishTime,gustSpeed));
                    dispatch(updateCalculatedValues(recalculatedValues));
                }
            }, error => {
                dispatch(setErrorDetails(error));
            });

        } else if (getState().routeInfo.gpxRouteData !== null) {
            if (getState().routeInfo.gpxRouteData.tracks[0] === undefined) {
                Sentry.captureMessage(JSON.stringify(getState().routeInfo.gpxRouteData));
                return dispatch(setErrorDetails("GPX route missing tracks"));
            }
            let point = getState().routeInfo.gpxRouteData.tracks[0].segments[0][0];
            let timeZonePromise = parser.findTimezoneForPoint(point.lat, point.lon,
                moment(getState().uiInfo.routeParams.start), getState().params.timezone_api_key);
            return timeZonePromise.then(timeZoneResult => {
                dispatch(setTimeZone(timeZoneResult.zoneId,timeZoneResult.offset));
                dispatch(setRouteInfo(
                    parser.walkGpxRoute(
                        getState().routeInfo.gpxRouteData,
                        moment(getState().uiInfo.routeParams.start),
                        getState().uiInfo.routeParams.pace,
                        getState().uiInfo.routeParams.interval,
                        getState().controls.userControlPoints,
                        getState().controls.metric,
                        timeZoneResult.zoneId)));
            }, error => {
                return dispatch(setErrorDetails(error));
            });
        }
    }
};

export const loadFromRideWithGps = function(routeNumber, isTrip) {
    return async function(dispatch) {
        dispatch(beginLoadingRoute('rwgps'));
        const parser = await getRouteParser().catch((err) => {dispatch(rwgpsRouteLoadingFailure(err));return null});
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'));
        }
        return parser.loadRwgpsRoute(routeNumber, isTrip).then( (routeData) => {
                dispatch(rwgpsRouteLoadingSuccess(routeData));
                dispatch(loadControlsFromCookie(routeData));
                dispatch(recalcRoute());
            }, error => {dispatch(rwgpsRouteLoadingFailure(error))}
        );
    };
};

export const GPX_ROUTE_LOADING_SUCCESS = 'GPX_ROUTE_LOADING_SUCCESS';
const gpxRouteLoadingSuccess = function(result) {
    return {
        type: GPX_ROUTE_LOADING_SUCCESS,
        gpxRouteData: result
    }
};

export const GPX_ROUTE_LOADING_FAILURE = 'GPX_ROUTE_LOADING_FAILURE';
const gpxRouteLoadingFailure = function(status) {
    return {
        type: GPX_ROUTE_LOADING_FAILURE,
        status: status
    }
};

export const CLEAR_ROUTE_DATA = 'CLEAR_ROUTE_DATA';
export const clearRouteData = function() {
    return {
        type: CLEAR_ROUTE_DATA,
    };
};

export const loadGpxRoute = function(event) {
    return async function (dispatch) {
        let gpxFiles = event.target.files;
        if (gpxFiles.length > 0) {
            dispatch(beginLoadingRoute('gpx'));
            const parser = await getRouteParser().catch((err) => {dispatch(gpxRouteLoadingFailure(err));return null});
            // handle failed load, error has already been dispatched
            if (parser == null) {
                return Promise.resolve(Error('Cannot load parser'));
            }
            parser.loadGpxFile(gpxFiles[0]).then( gpxData => {
                    dispatch(gpxRouteLoadingSuccess(gpxData));
                    dispatch(recalcRoute());
                }, error => dispatch(gpxRouteLoadingFailure(error))
            );
        }
        else {
            dispatch(clearRouteData());
        }
    }
};

export const SET_SHORT_URL = 'SET_SHORT_URL';
export const setShortUrl = function(url) {
    return {
        type: SET_SHORT_URL,
        url: url
    }
};

/*
 * @param {String} url the URL to shortern
 * @returns {function(*=, *): Promise<T | never>} return value
 */
export const shortenUrl = function(url) {
    return function (dispatch) {
        return fetch("/bitly",
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({longUrl: url})
            })
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.error === null) {
                    return dispatch(setShortUrl(responseJson.url));
                } else {
                    return dispatch(setErrorDetails(responseJson.error));
                }
            })
    }
};

export const SET_QUERY = 'SET_QUERY';
export const setQueryString = function(query) {
    return {
        type: SET_QUERY,
        queryString: query
    };
};

export const CLEAR_QUERY = 'CLEAR_QUERY';
export const clearQueryString = function() {
    return {
        type: CLEAR_QUERY,
    };
};

export const ADD_CONTROL = 'ADD_CONTROL';
export const addControl = function() {
    return {
        type: ADD_CONTROL
    };
};

export const SET_METRIC = 'SET_METRIC';
export const setMetric = function(metric) {
    return {
        type: SET_METRIC,
        metric: metric
    };
};

export const TOGGLE_METRIC = 'TOGGLE_METRIC';
export const toggleMetric = function() {
    return {
        type: TOGGLE_METRIC
    };
};

export const TOGGLE_DISPLAY_BANKED = 'TOGGLE_DISPLAY_BANKED';
export const toggleDisplayBanked = function() {
    return {
        type: TOGGLE_DISPLAY_BANKED
    };
};

export const TOGGLE_STRAVA_ANALYSIS = 'TOGGLE_STRAVA_ANALYSIS';
export const toggleStravaAnalysis = function() {
    return {
        type: TOGGLE_STRAVA_ANALYSIS
    };
};

export const SET_STRAVA_TOKEN = 'SET_STRAVA_TOKEN';
export const setStravaToken = function(token) {
    return {
        type: SET_STRAVA_TOKEN,
        token: token
    };
};

export const SET_STRAVA_ACTIVITY = 'SET_STRAVA_ACTIVITY';
export const setStravaActivity = function(activity) {
    return {
        type: SET_STRAVA_ACTIVITY,
        activity: activity
    };
};

export const SET_STRAVA_ERROR = 'SET_STRAVA_ERROR';
export const setStravaError = function(error) {
    return {
        type: SET_STRAVA_ERROR,
        error: error
    };
};

export const BEGIN_STRAVA_FETCH = 'BEGIN_STRAVA_FETCH';
export const beginStravaFetch = function() {
    return {
        type: BEGIN_STRAVA_FETCH
    };
};

export const STRAVA_FETCH_SUCCESS = 'STRAVA_FETCH_SUCCESS';
export const stravaFetchSuccess = function(data) {
    return {
        type: STRAVA_FETCH_SUCCESS,
        data: data
    };
};

export const STRAVA_FETCH_FAILURE = 'STRAVA_FETCH_FAILURE';
export const stravaFetchFailure = function(error) {
    return {
        type: STRAVA_FETCH_FAILURE,
        error: error
    };
};

export const SET_ACTUAL_FINISH_TIME = 'SET_ACTUAL_FINISH_TIME';
export const setActualFinishTime = function(finishTime) {
    return {
        type: SET_ACTUAL_FINISH_TIME,
        finishTime: finishTime
    };
};

export const SET_DISPLAYED_FINISH_TIME = 'SET_DISPLAYED_FINISH_TIME';
export const setDisplayedFinishTime = function(displayedTime) {
    return {
        type: SET_DISPLAYED_FINISH_TIME,
        displayedTime: displayedTime
    };
};

export const SET_ACTUAL_PACE = 'SET_ACTUAL_PACE';
export const setActualPace = function(pace) {
    return {
        type: SET_ACTUAL_PACE,
        pace: pace
    };
};

export const UPDATE_ACTUAL_ARRIVAL_TIMES = 'UPDATE_ACTUAL_ARRIVAL_TIMES';
export const updateActualArrivalTimes = function(times) {
    return {
        type: UPDATE_ACTUAL_ARRIVAL_TIMES,
        arrivalTimes: times
    };
};

export const SET_ACTION_URL = 'SET_ACTION_URL';
export const setActionUrl = function(action) {
    return {
        type: SET_ACTION_URL,
        action: action
    };
};

export const SET_API_KEYS = 'SET_API_KEYS';
export const setApiKeys = function(mapsKey,timezoneKey, bitlyToken) {
    return {
        type: SET_API_KEYS,
        mapsKey: mapsKey,
        timezoneKey: timezoneKey,
        bitlyToken: bitlyToken
    };
};

export const SET_ANALYSIS_INTERVAL = 'SET_ANALYSIS_INTERVAL';
export const setAnalysisInterval = function(interval) {
    return {
        type: SET_ANALYSIS_INTERVAL,
        interval: interval
    };
};

const getStravaParser = async function() {
    const parser = await import(/* webpackChunkName: "StravaRouteParser" */ '../stravaRouteParser');
    return parser.default;
};

export const loadStravaActivity = function(activity) {
    return async function (dispatch, getState) {
        if (getState().strava.activityData !== null && getState().strava.activityStream !== null) {
            return new Promise((resolve) => {
                resolve({
                    activity: getState().strava.activityData,
                    stream: getState().strava.activityStream
                });
            });
        }
        const parser = await getStravaParser().catch((err) => {dispatch(stravaFetchFailure(err));return null});
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'));
        }
        dispatch(beginStravaFetch());
        return parser.fetchStravaActivity(activity, getState().strava.token);
    }
};

export const SET_PACE_OVER_TIME = 'SET_PACE_OVER_TIME';
export const setPaceOverTime = function(calculatedPaces) {
    return {
        type: SET_PACE_OVER_TIME,
        calculatedPaces: calculatedPaces
    };
};

export const getPaceOverTime = function() {
    return async function (dispatch,getState) {
        if (getState().strava.activityData===null) {
            return;
        }
        const parser = await getStravaParser().catch((err) => {dispatch(stravaFetchFailure(err));return null});
        // handle failed load, error has already been dispatched
        if (parser === null) {
            return Promise.resolve(Error('Cannot load parser'));
        }
        return dispatch(setPaceOverTime(parser.findMovingAverages(getState().strava.activityData,
            getState().strava.activityStream, getState().strava.analysisInterval)));
    }
};

export const updateExpectedTimes = function(activity) {
    return function (dispatch,getState) {
        dispatch(loadStravaActivity(activity)).then( async result => {
            dispatch(stravaFetchSuccess(result));
            const parser = await getStravaParser().catch((err) => {dispatch(stravaFetchFailure(err));return null});
            // handle failed load, error has already been dispatched
            if (parser === null) {
                return Promise.resolve(Error('Cannot load parser'));
            }
            let timesFromData = parser.computeTimesFromData(getState().controls.userControlPoints,
                result.activity, result.stream);
            dispatch(updateActualArrivalTimes(timesFromData.controls));
            dispatch(setActualPace(timesFromData.actualPace));
            dispatch(setActualFinishTime(timesFromData.actualFinishTime));
            return dispatch(getPaceOverTime());
        }, error => {
            dispatch(stravaFetchFailure(error));
            dispatch(setStravaToken(null))
        });
    }
};

export const SUBRANGE_MAP = 'SUBRANGE_MAP';
export const setSubrange = function(start,finish) {
    return {
        type: SUBRANGE_MAP,
        start: start,
        finish: finish
    };
};

export const SET_WEATHER_RANGE = 'SET_WEATHER_RANGE';
export const setWeatherRange = function(start,finish) {
    return {
        type: SET_WEATHER_RANGE,
        start: start,
        finish: finish
    };
};

export const RESET = 'RESET';
export const reset = () => {return {type:RESET}};

export const NEW_USER_MODE = 'NEW_USER_MODE';
export const newUserMode = (value) => {return {type:NEW_USER_MODE,value:value}};

export const SET_TABLE_VIEWED = 'SET_TABLE_VIEWED';
export const setTableViewed = () => {return {type:SET_TABLE_VIEWED}};

export const SET_MAP_VIEWED = 'SET_MAP_VIEWED';
export const setMapViewed = () => {return {type:SET_MAP_VIEWED}};
