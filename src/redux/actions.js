import cookie from 'react-cookies';
import { doForecast } from '../utils/forecastUtilities';
import { loadRwgpsRoute } from '../utils/rwgpsUtilities';
import { controlsMeaningfullyDifferent, parseControls, extractControlsFromRoute } from '../utils/util';
import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";
import { updateHistory } from "../jsx/app/updateHistory";

export const componentLoader = (lazyComponent, attemptsLeft) => {
    return new Promise((resolve, reject) => {
        lazyComponent
            .then(resolve)
            .catch((error)=>{
                // let us retry after 1500 ms
                setTimeout(() => {
                    if (attemptsLeft === 1) {
                        // instead of rejecting reload the window
                        console.error(error);
                        if (!navigator.userAgent.includes("jsdom")) {
                            window.location.reload();
                        }
                        return;
                    }
                    componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
                }, 1500)
            })
    });
};

const sanitizeCookieName = (cookieName) => {
    return encodeURIComponent(cookieName.replace(/[ =/]/,''));
};

export const saveCookie = (name,value) => {
        cookie.save(sanitizeCookieName(name),value,{maxAge:60*60*24*7});
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

export const SET_START_TIME = 'SET_START_TIME';
const setStartUnthunky = (start, zone) => {
    return {
        type: SET_START_TIME,
        start: start,
        zone: zone
    }
}
export const INVALIDATE_FORECAST = 'INVALIDATE_FORECAST';
const invalidateForecast = () => {
    return { type: INVALIDATE_FORECAST }
};

const cancelForecast = () => {
    return function(dispatch, getState) {
        const cancel = getState().uiInfo.dialogParams.cancelActiveFetchMethod
        if (cancel !== null) {
            cancel()
        }
        dispatch(invalidateForecast())
    }
};

export const setStart = function (start, zone) {
    return function(dispatch) {
        dispatch(setStartUnthunky(start, zone))
        dispatch(cancelForecast())
    }
};

export const SET_INITIAL_START = 'SET_INITIAL_START';
export const setInitialStart = function (start, zone) {
    return {
        type: SET_INITIAL_START,
        start: start,
        zone: zone
    }
};

export const SET_START_TIMESTAMP = 'SET_START_TIMESTAMP';
export const setStartTimestamp = function (start, zone) {
    return {
        type: SET_START_TIMESTAMP,
        start: Number.parseInt(start),
        zone: zone
    }
};

export const SET_PACE = 'SET_PACE';
const setPaceUnthunky = function(pace) {
    return {
        type: SET_PACE,
        pace: pace
    }
};
export const setPace = function (pace) {
    return function(dispatch) {
        dispatch(setPaceUnthunky(pace))
        dispatch(cancelForecast())
    }
};

export const SET_INTERVAL = 'SET_INTERVAL';
const setIntervalUnthunky = function(interval) {
    return {
        type: SET_INTERVAL,
        interval: interval
    }
};
export const setInterval = function (interval) {
    return function(dispatch) {
        dispatch(setIntervalUnthunky(interval))
        dispatch(cancelForecast())
    }
};

export const TOGGLE_ROUTE_IS_TRIP = 'TOGGLE_ROUTE_IS_TRIP';
export const toggleRouteIsTrip = function() {
    return {
        type: TOGGLE_ROUTE_IS_TRIP
    }
};

 export const SET_ROUTE_IS_TRIP = 'SET_ROUTE_IS_TRIP';
 export const setRouteIsTrip = function(isTrip) {
     return {
         type: SET_ROUTE_IS_TRIP, isTrip:isTrip
     }
 };

const getRouteParser = async function () {
    const parser = await componentLoader(import(/* webpackChunkName: "RwgpsParser" */ '../utils/gpxParser'), 5);
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

const getRouteName = function(routeData) {
    if (routeData.route !== undefined) {
        return routeData.route.name;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.name;
    } else {
        return null;
    }
};

const getRouteDistanceInKm = function(routeData) {
    if (routeData.route !== undefined) {
        return routeData.route.distance/1000;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.distance/1000;
    } else {
        return null;
    }
};

const getRouteId = function(routeData) {
    if (routeData.route !== undefined) {
        return routeData.route.id;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.id;
    } else {
        return null;
    }
};

export const UPDATE_USER_CONTROLS = 'UPDATE_USER_CONTROLS';
const updateUserControlsUnthunky = function(controls) {
    return {
        type: UPDATE_USER_CONTROLS,
        controls: controls
    };
};
export const updateUserControls = function(controls) {
    return function(dispatch,getState) {
        const different = controlsMeaningfullyDifferent(controls, getState().controls.userControlPoints)
        dispatch(updateUserControlsUnthunky(controls))
        if (different) {
            dispatch(cancelForecast())
        }
    }
};

export const loadControlsFromCookie = function(routeData) {
    return function(dispatch) {
        let routeName = getRouteName(routeData);
        if (routeName !== null) {
            let savedControlPoints = loadCookie(routeName);
            if (savedControlPoints !== undefined && savedControlPoints.length > 0) {
                dispatch(updateUserControls(parseControls(savedControlPoints, true)));
            }
        }
    };
};

export const BEGIN_FETCHING_FORECAST = 'BEGIN_FETCHING_FORECAST';
const beginFetchingForecast = function(abortMethod) {
    return {
        type: BEGIN_FETCHING_FORECAST,
        abortMethod
    }
};

export const FORECAST_FETCH_SUCCESS = 'FORECAST_FETCH_SUCCESS';
const forecastFetchSuccess = function(forecastInfo, timeZoneId) {
    return {
        type: FORECAST_FETCH_SUCCESS,
        forecastInfo: forecastInfo,
        timeZoneId
    }
};

export const FORECAST_FETCH_FAILURE = 'FORECAST_FETCH_FAILURE';
const forecastFetchFailure = function(error) {
    return {
        type: FORECAST_FETCH_FAILURE,
        error:error
    }
};

export const FORECAST_FETCH_CANCELED = 'FORECAST_FETCH_CANCELED';
const forecastFetchCanceled = function(error) {
    return {
        type: FORECAST_FETCH_CANCELED,
        error:error
    }
};

export const requestForecast = function(routeInfo) {
    return async function(dispatch,getState) {
        // ReactGA.send({ hitType: "pageview", page: "/forecast" });
        const transaction = Sentry.startTransaction({ name: "requestForecast" });
        let span;
        if (transaction) {
            span = transaction.startChild({ op: "forecast" }); // This function returns a Span
        }
        if (routeInfo.rwgpsRouteData) {
            ReactGA.event('add_to_cart', {
                value:getRouteDistanceInKm(routeInfo.rwgpsRouteData),
                items:[{item_id:getRouteId(routeInfo.rwgpsRouteData),item_name:getRouteName(routeInfo.rwgpsRouteData)}]
            });
        }
        const fetchController = new AbortController()
        const abortMethod = fetchController.abort.bind(fetchController)
        dispatch(beginFetchingForecast(abortMethod));
        const { result, value, error } = await doForecast(getState(), fetchController.signal);
        if (transaction) {
            span.finish(); // Remember that only finished spans will be sent with the transaction
            transaction.finish(); // Finishing the transaction will send it to Sentry
        }
        if (result === "success") {
            const { forecast, timeZoneId } = value
            dispatch(forecastFetchSuccess(forecast, timeZoneId));
        } else if (result === "error") {
            dispatch(forecastFetchFailure(error));
        } else {
            dispatch(forecastFetchCanceled());
        }
    }
};

export const SET_ERROR_DETAILS = 'SET_ERROR_DETAILS';
export const setErrorDetails = function(details) {
    return {
        type: SET_ERROR_DETAILS,
        details: details
    };
};

export const SET_LOADING_FROM_URL = 'SET_LOADING_FROM_URL';
const setLoadingFromURL = (loading) => {
    return {
        type: SET_LOADING_FROM_URL,
        loading
    };
}
export const SET_DISPLAY_CONTROL_TABLE_UI = 'SET_DISPLAY_CONTROL_TABLE_UI';
export const setDisplayControlTableUI = (display) => { return { type: SET_DISPLAY_CONTROL_TABLE_UI, displayControlTableUI: display } }

export const loadFromRideWithGps = function(routeNumber, isTrip) {
    return function(dispatch, getState) {
        // ReactGA.send({ hitType: "pageview", page: "/loadRoute" });
        const transaction = Sentry.startTransaction({ name: "loadingRwgpsRoute" });
        let span;
        if (transaction) {
            span = transaction.startChild({ op: "load" }); // This function returns a Span
        }
        routeNumber = routeNumber || getState().uiInfo.routeParams.rwgpsRoute
        ReactGA.event('login', {method:routeNumber});
        isTrip = isTrip || getState().uiInfo.routeParams.rwgpsRouteIsTrip
        dispatch(beginLoadingRoute('rwgps'));
        dispatch(cancelForecast())
        return loadRwgpsRoute(routeNumber, isTrip, getState().rideWithGpsInfo.token).then((routeData) => {
            dispatch(rwgpsRouteLoadingSuccess(routeData));
            if (getState().controls.userControlPoints.length === 0) {
                const extractedControls = extractControlsFromRoute(routeData);
                if (extractedControls.length !== 0) {
                    dispatch(updateUserControls(extractedControls))
                    dispatch(setDisplayControlTableUI(true))
                }
            }
            // dispatch(loadControlsFromCookie(routeData));
            if (transaction) {
                span.finish(); // Remember that only finished spans will be sent with the transaction
                transaction.finish(); // Finishing the transaction will send it to Sentry
            }
        }, error => { return dispatch(rwgpsRouteLoadingFailure(error)) }
        );
    };
};

export const SET_QUERY = 'SET_QUERY';
export const setQueryString = function(query) {
    return {
        type: SET_QUERY,
        queryString: query
    };
};

export const loadRouteFromURL = () => {
    return async function(dispatch, getState) {
        // ReactGA.send({ hitType: "pageview", page: "/loadRoute" });
        // ReactGA.event('login', {method:getState().uiInfo.routeParams.rwgpsRoute});
        await dispatch(setLoadingFromURL(true))
        await dispatch(loadFromRideWithGps())
        const error = getState().uiInfo.dialogParams.errorDetails
        if (getState().uiInfo.routeParams.stopAfterLoad) {
            ReactGA.event('search', {search_term:getState().uiInfo.routeParams.rwgpsRoute})
        }
        if (error === null && !getState().uiInfo.routeParams.stopAfterLoad) {
            await dispatch(requestForecast(getState().routeInfo));
            updateHistory(getState().controls.queryString);
        }
        dispatch(setLoadingFromURL(false))
    }
}

export const SET_STOP_AFTER_LOAD = 'STOP_AFTER_LOAD';
export const setStopAfterLoad = (stopAfterLoad) => {
    return {
        type: SET_STOP_AFTER_LOAD,
        value: stopAfterLoad
    }
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
        const transaction = Sentry.startTransaction({ name: "shortenUrl" });
        let span;
        if (transaction) {
            span = transaction.startChild({ op: "load" }); // This function returns a Span
        }
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
            .catch( error => {return setErrorDetails(error)})
            .then(responseJson => {
                if (transaction) {
                    span.finish(); // Remember that only finished spans will be sent with the transaction
                    transaction.finish(); // Finishing the transaction will send it to Sentry
                }
                if (responseJson.error === null) {
                    return dispatch(setShortUrl(responseJson.url));
                } else {
                    return dispatch(setErrorDetails(responseJson.error));
                }
            })
    }
};

export const CLEAR_QUERY = 'CLEAR_QUERY';
export const clearQueryString = function() {
    return {
        type: CLEAR_QUERY,
    };
};

export const addControl = function() {
    return function (dispatch, getState) {
        dispatch(updateUserControls([
...getState().controls.userControlPoints,
{ name: "", distance: 0, duration: 0 }
]))
    }
};
export const removeControl = function(indexToRemove) {
    return function (dispatch, getState) {
        dispatch(updateUserControls(getState().controls.userControlPoints.filter((control, index) => index !== indexToRemove)))
    }
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

export const SET_ROUTE_LOADING_MODE = 'SET_ROUTE_LOADING_MODE';
export const setRouteLoadingMode = function(newMode) {
    return {
        type: SET_ROUTE_LOADING_MODE,
        newMode
    };
};

export const SET_STRAVA_TOKEN = 'SET_STRAVA_TOKEN';
export const setStravaToken = function(access_token, expires_at) {
    return {
        type: SET_STRAVA_TOKEN,
        token: access_token,
        expires_at: expires_at
    };
};

export const SET_STRAVA_REFRESH_TOKEN = 'SET_STRAVA_REFRESH_TOKEN';
export const setStravaRefreshToken = function(refresh_token) {
    return {
        type: SET_STRAVA_REFRESH_TOKEN,
        refresh_token: refresh_token
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
    const parser = await import(/* webpackChunkName: "StravaRouteParser" */ '../utils/stravaRouteParser');
    return parser.default;
};

const stravaTokenTooOld = (getState) => {
    if (getState().strava.expires_at == null) {
        return false;
    }
    return (getState().strava.expires_at < Math.round(Date.now()/1000));
};

const refreshOldToken = (dispatch, getState) => {
    if (stravaTokenTooOld(getState)) {
        return new Promise((resolve, reject) => {
            fetch(`/refreshStravaToken?refreshToken=${getState().strava.refresh_token}`).then(response => {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(response => {
                if (response === undefined) {
                    dispatch(setStravaError(Error("Received undefined response from Strava auth service")));
                    reject(Error("Received undefined response from Strava auth service"));
                }
                else {
                    dispatch(setStravaToken(response.access_token, response.expires_at));
                    resolve(response.access_token);
                }
            }, error => {
                dispatch(setStravaError(error));
                reject(error);
            });
        });
    } else {
        return new Promise((resolve) => {resolve(getState().strava.access_token)});
    }
};

export const loadStravaActivity = function() {
    return async function (dispatch, getState) {
        const parser = await getStravaParser().catch((err) => {
            dispatch(stravaFetchFailure(err));
            return null
        });
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'));
        }

        const access_token = await refreshOldToken(dispatch, getState)
        dispatch(beginStravaFetch());
        const activityId = getState().strava.activity
        return parser.fetchStravaActivity(activityId, access_token).then(result => {
            dispatch(stravaFetchSuccess(result));
        }).catch(error => {
            dispatch(stravaFetchFailure(error));
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

export const TOGGLE_MAP_RANGE = 'TOGGLE_MAP_RANGE';
export const toggleMapRange = function(start,finish) {
    return {
        type: TOGGLE_MAP_RANGE,
        start: start,
        finish: finish
    };
};

export const SET_WEATHER_RANGE = 'SET_WEATHER_RANGE';
export const setWeatherRange = function(startInKm, finishInKm) {
    return {
        type: SET_WEATHER_RANGE,
        start: startInKm,
        finish: finishInKm
    };
};

export const TOGGLE_WEATHER_RANGE = 'TOGGLE_WEATHER_RANGE';
export const toggleWeatherRange = function(start,finish) {
    return {
        type: TOGGLE_WEATHER_RANGE,
        start: start,
        finish: finish
    };
};

export const RESET = 'RESET';
export const reset = () => {return {type:RESET}};

export const SET_TABLE_VIEWED = 'SET_TABLE_VIEWED';
export const setTableViewed = () => {return {type:SET_TABLE_VIEWED}};

export const SET_MAP_VIEWED = 'SET_MAP_VIEWED';
export const setMapViewed = () => {return {type:SET_MAP_VIEWED}};

export const SET_WEATHER_PROVIDER = 'SET_WEATHER_PROVIDER';
export const setWeatherProviderUnthunky = (weatherProvider) => {return {type:SET_WEATHER_PROVIDER,
    weatherProvider:weatherProvider==='darksky'?'weatherKit':weatherProvider}}

export const setWeatherProvider = (weatherProvider) => {
    return function(dispatch) {
        dispatch(setWeatherProviderUnthunky(weatherProvider));
        dispatch(cancelForecast());
    }
}

export const SET_SHOW_WEATHER_PROVIDER = 'SET_SHOW_WEATHER_PROVIDER';
export const showWeatherProvider = (showProvider) => {return {type:SET_SHOW_WEATHER_PROVIDER, showProvider:showProvider}}

export const SET_RWGPS_TOKEN = 'SET_RWGPS_TOKEN';
export const setRwgpsToken = (token) => {
        return {type:SET_RWGPS_TOKEN, token:token}
};
export const SET_PINNED_ROUTES = 'SET_PINNED_ROUTES';
export const setPinnedRoutes = (pinned) => {
        return {type:SET_PINNED_ROUTES, pinned:pinned};
};

export const SET_LOADING_PINNED = 'SET_LOADING_PINNED';
export const setLoadingPinned = (value) => {
        return {type:SET_LOADING_PINNED, loading:value};
};

export const TOGGLE_ZOOM_TO_RANGE = 'TOGGLE_ZOOM_TO_RANGE';
export const toggleZoomToRange = () => {
        return {type:TOGGLE_ZOOM_TO_RANGE};
}

export const SET_ZOOM_TO_RANGE = 'SET_ZOOM_TO_RANGE';
export const setZoomToRange = (value) => {
        return {type:SET_ZOOM_TO_RANGE, zoom:value};
}

export const TOGGLE_FETCH_AQI = 'TOGGLE_FETCH_AQI';
export const toggleFetchAqi = () => {
        return {type:TOGGLE_FETCH_AQI};
}

export const SET_FETCH_AQI = 'SET_FETCH_AQI';
export const setFetchAqi = (value) => {
        return {type:SET_FETCH_AQI, fetchAqi:value};
}

export const SET_USE_PINNED_ROUTES = 'SET_USE_PINNED_ROUTES'
export const setUsePinnedRoutes = (value) => {
    return {type:SET_USE_PINNED_ROUTES, value:value};
}
