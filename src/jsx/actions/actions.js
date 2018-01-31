import moment from 'moment';

export const SET_RWGPS_ROUTE = 'SET_RWGPS_ROUTE';
export function setRwgpsRoute(route) {
    return {
        type: SET_RWGPS_ROUTE,
        route: route
    }
}

export const SET_GPX_ROUTE = 'SET_GPX_ROUTE';
export function setGpxRoute(route) {
    return {
        type: SET_GPX_ROUTE,
        route: route
    }
}

export const SET_START = 'SET_START';
export function setStart(start) {
    return {
        type: SET_START,
        start: start
    }
}

export const SET_PACE = 'SET_PACE';
export function setPace(pace) {
    return {
        type: SET_PACE,
        pace: pace
    }
}

export const SET_INTERVAL = 'SET_INTERVAL';
export function setInterval(interval) {
    return {
        type: SET_INTERVAL,
        interval: interval
    }
}

async function getRouteParser() {
    const parser = await import(/* webpackChunkName: "RwgpsParser" */ '../gpxParser');
    return parser.default;
}

export const RECALC_ROUTE = 'RECALC_ROUTE';
export function recalcRoute() {
    return async function(dispatch, getState) {
        const parser = await getRouteParser();
        dispatch(setRouteInfo(
            parser.walkRoute(moment(getState().uiInfo.start),
                getState().uiInfo.pace, getState().uiInfo.interval,
                getState().controls.controlPoints,getState().controls.metric)));
    }
}

export const loadFromRideWithGps = function(routeNumber, isTrip, timezone_api_key) {
    return async function(dispatch) {
        dispatch(beginLoadingRoute('rwgps'));
        const parser = await getRouteParser();
        parser.loadRwgpsRoute(routeNumber, isTrip, timezone_api_key).then( (routeData) => {
                dispatch(rwgpsRouteLoadingSuccess(routeData));
                dispatch(recalcRoute());
            }, error => {dispatch(rwgpsRouteLoadingFailure(error))}
        );
    };
};

export const BEGIN_LOADING_ROUTE = 'BEGIN_LOADING_ROUTE';
function beginLoadingRoute(source) {
    return {
        type: BEGIN_LOADING_ROUTE
    }
}

export const BEGIN_FETCHING_FORECAST = 'BEGIN_FETCHING_FORECAST';
function beginFetchingForecast() {
    return {
        type: BEGIN_FETCHING_FORECAST
    }
}

export const FORECAST_FETCH_SUCCESS = 'FORECAST_FETCH_SUCCESS';
function forecastFetchSuccess() {
    return {
        type: FORECAST_FETCH_SUCCESS
    }
}

export const FORECAST_FETCH_FAILURE = 'FORECAST_FETCH_FAILURE';
function forecastFetchFailure(error,source) {
    return {
        type: FORECAST_FETCH_FAILURE,
        error:error, source:source
    }
}

export const RWGPS_ROUTE_LOADING_SUCCESS = 'RWGPS_ROUTE_LOADING_SUCCESS';
function rwgpsRouteLoadingSuccess(routeData) {
    return {
        type: RWGPS_ROUTE_LOADING_SUCCESS,
        routeData : routeData
    }
}
export const RWGPS_ROUTE_LOADING_FAILURE = 'RWGPS_ROUTE_LOADING_FAILURE';
function rwgpsRouteLoadingFailure(status) {
    return {
        type: RWGPS_ROUTE_LOADING_FAILURE,
        status: status
    }
}

export const GPX_ROUTE_LOADING_SUCCESS = 'GPX_ROUTE_LOADING_SUCCESS';
function gpxRouteLoadingSuccess(gpxRouteData) {
    return {
        type: GPX_ROUTE_LOADING_SUCCESS,
        gpxRouteData: gpxRouteData
    }
}
export const GPX_ROUTE_LOADING_FAILURE = 'GPX_ROUTE_LOADING_FAILURE';
function gpxRouteLoadingFailure(status) {
    return {
        type: GPX_ROUTE_LOADING_FAILURE,
        status: status
    }
}

export const SET_ROUTE_INFO = 'SET_ROUTE_INFO';
function setRouteInfo(routeInfo) {
    return {
        type: SET_ROUTE_INFO,
        routeInfo: routeInfo
    }
}

export const SHOW_FORM = 'SHOW_FORM';
function showForm() {
    return {
        type: SHOW_FORM
    }
}

export const HIDE_FORM = 'HIDE_FORM';
function hideForm() {
    return {
        type: HIDE_FORM
    }
}

export function loadGpxRoute(event,timezone_api_key) {
    return async function (dispatch) {
        dispatch(beginLoadingRoute());
        let gpxFiles = event.target.files;
        if (gpxFiles.length > 0) {
            const parser = await getRouteParser();
            parser.loadGpxFile(gpxFiles[0],timezone_api_key).then( gpxData => {
                    dispatch(gpxRouteLoadingSuccess(gpxData))
                }, error => dispatch(gpxRouteLoadingFailure(error))
            );
        }

    }
}

export function requestForecast(routeInfo) {
    return function(dispatch,getState) {
        dispatch(beginFetchingForecast());
        dispatch(hideForm());
        let formdata = new FormData();
        formdata.append('locations', JSON.stringify(routeInfo.forecastRequest));
        formdata.append('timezone', routeInfo.timeZoneOffset);
        fetch(getState().params.action,
            {
                method:'POST',
                body:formdata
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    let error = response.statusText !== undefined ? response.statusText : response['status'];
                    let source = routeInfo.gpxRouteData !== null ? 'gpx' : 'rwgps';
                    dispatch(forecastFetchFailure(error,source));
                } })
            .then(async response => {
                dispatch(forecastFetchSuccess());
                dispatch(updateForecastInfo(response));
                let controlsToUpdate = getState().controls.controlPoints.slice();
                const parser = await getRouteParser();
                let weatherCorrectionMinutes = parser.adjustForWind(response,getState().uiInfo.pace,controlsToUpdate,getState().uiInfo.start,getState().uiInfo.metric);
                dispatch(addWeatherCorrection(weatherCorrectionMinutes));
                dispatch(updateControls(controlsToUpdate));
            }).catch (error => {
                let source = getState().routeInfo.gpxRouteData !== null ? 'gpx' : 'rwgps';
                let errorMessage = error.message !== undefined ? error.message : error;
                dispatch(forecastFetchFailure(errorMessage,source));
            }
        )
    }
}

export const UPDATE_FORECAST_INFO = 'UPDATE_FORECAST_INFO';
export function updateForecastInfo(forecastInfo) {
    return {
        type: UPDATE_FORECAST_INFO,
        forecastInfo: forecastInfo
    };
}
export const SHORTEN_URL = 'SHORTEN_URL';

export const SET_ADDRESS = 'SET_ADDRESS';
export function setAddress(address) {
    return {
        type: SET_ADDRESS,
        address: address
    };
}
export const CLEAR_ADDRESS = 'CLEAR_ADDRESS';
export function clearAddress() {
    return {
        type: CLEAR_ADDRESS,
    };
}
export const CLEAR_ROUTE_DATA = 'CLEAR_ROUTE_DATA';
export function clearRouteData() {
    return {
        type: CLEAR_ROUTE_DATA,
    };
}
export const UPDATE_CONTROLS = 'UPDATE_CONTROLS';

export function updateControls(controls) {
    return {
        type: UPDATE_CONTROLS,
        controls: controls
    };
}

export const TOGGLE_METRIC = 'TOGGLE_METRIC';
export function toggleMetric() {
    return {
        type: TOGGLE_METRIC
    };
}

export const SET_STRAVA_TOKEN = 'SET_STRAVA_TOKEN';
export function setStravaToken(token) {
    return {
        type: SET_STRAVA_TOKEN,
        token: token
    };
}

export const SET_STRAVA_ACTIVITY = 'SET_STRAVA_ACTIVITY';
export function setStravaActivity(activity) {
    return {
        type: SET_STRAVA_ACTIVITY,
        activity: activity
    };
}

export const ADD_WEATHER_CORRECTION = 'ADD_WEATHER_CORRECTION';
export function addWeatherCorrection(weatherCorrection) {
    return {
        type: ADD_WEATHER_CORRECTION,
        finishTime: weatherCorrection
    };
}

export const SET_ACTUAL_FINISH_TIME = 'SET_ACTUAL_FINISH_TIME';
export function setActualFinishTime(finishTime) {
    return {
        type: SET_ACTUAL_FINISH_TIME,
        finishTime: finishTime
    };
}

export const SET_ACTION_URL = 'SET_ACTION_URL';
export function setActionUrl(action) {
    return {
        type: SET_ACTION_URL,
        action: action
    };
}

export const SET_ERROR_DETAILS = 'SET_ERROR_DETAILS';
export function setErrorDetails(details) {
    return {
        type: SET_ERROR_DETAILS,
        details: details
    };
}


