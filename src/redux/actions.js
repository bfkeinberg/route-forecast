import cookie from 'react-cookies';
import { doForecast } from '../utils/forecastUtilities';
import { loadRwgpsRoute } from '../utils/rwgpsUtilities';
import { controlsMeaningfullyDifferent, parseControls, extractControlsFromRoute } from '../utils/util';
import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";
// import { updateHistory } from "../jsx/app/updateHistory";
import { userControlsUpdated, displayControlTableUiSet, rwgpsRouteLoaded, routeDataCleared, loadingFromUrlSet,
    routeLoadingBegun, forecastFetchBegun, forecastFetched, forecastFetchFailed, forecastFetchCanceled,
    rwgpsRouteLoadingFailed, gpxRouteLoaded, gpxRouteLoadingFailed, shortUrlSet,
    errorDetailsSet,weatherProviderSet, intervalSet, paceSet, forecastInvalidated, startTimeSet } from './reducer';

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

let fetchAbortMethod = null;

const sanitizeCookieName = (cookieName) => {
    return encodeURIComponent(cookieName.replace(/[ =/]/,''));
};

export const saveCookie = (name,value) => {
        cookie.save(sanitizeCookieName(name),value,{maxAge:60*60*24*7});
};

export const loadCookie = (name) => {
    return cookie.load(sanitizeCookieName(name));
};

const cancelForecast = () => {
    return function(dispatch) {
        const cancel = fetchAbortMethod
        if (cancel !== null) {
            cancel()
        }
        dispatch(forecastInvalidated())
    }
};

export const setStart = function (start) {
    return function(dispatch) {
        dispatch(startTimeSet(start))
        dispatch(cancelForecast())
    }
};

export const setPace = function (pace) {
    return function(dispatch) {
        dispatch(paceSet(pace))
        dispatch(cancelForecast())
    }
};

export const setInterval = function (interval) {
    return function(dispatch) {
        dispatch(intervalSet(interval))
        dispatch(cancelForecast())
    }
};

 const getRouteParser = async function () {
    const parser = await componentLoader(import(/* webpackChunkName: "RwgpsParser" */ '../utils/gpxParser'), 5);
    return parser.default;
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

export const updateUserControls = function(controls) {
    return function(dispatch,getState) {
        const different = controlsMeaningfullyDifferent(controls, getState().controls.userControlPoints)
        dispatch(userControlsUpdated(controls))
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
        fetchAbortMethod = abortMethod;
        dispatch(forecastFetchBegun());
        const { result, value, error } = await doForecast(getState(), fetchController.signal);
        if (transaction) {
            span.finish(); // Remember that only finished spans will be sent with the transaction
            transaction.finish(); // Finishing the transaction will send it to Sentry
        }
        fetchAbortMethod = null;
        if (result === "success") {
            const { forecast, timeZoneId } = value
            dispatch(forecastFetched({forecastInfo:forecast, timeZoneId:timeZoneId}));
        } else if (result === "error") {
            dispatch(forecastFetchFailed(error));
        } else {
            dispatch(forecastFetchCanceled());
        }
    }
};

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
        dispatch(routeLoadingBegun('rwgps'));
        dispatch(cancelForecast())
        return loadRwgpsRoute(routeNumber, isTrip, getState().rideWithGpsInfo.token).then((routeData) => {
            dispatch(rwgpsRouteLoaded(routeData));
            if (getState().controls.userControlPoints.length === 0) {
                const extractedControls = extractControlsFromRoute(routeData);
                if (extractedControls.length !== 0) {
                    dispatch(updateUserControls(extractedControls))
                    dispatch(displayControlTableUiSet(true))
                }
            }
            // dispatch(loadControlsFromCookie(routeData));
            if (transaction) {
                span.finish(); // Remember that only finished spans will be sent with the transaction
                transaction.finish(); // Finishing the transaction will send it to Sentry
            }
        }, error => { return dispatch(rwgpsRouteLoadingFailed(error.message)) }
        );
    };
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
            .catch( error => {return errorDetailsSet(error)})
            .then(responseJson => {
                if (transaction) {
                    span.finish(); // Remember that only finished spans will be sent with the transaction
                    transaction.finish(); // Finishing the transaction will send it to Sentry
                }
                if (responseJson.error === null) {
                    return dispatch(shortUrlSet(responseJson.url));
                } else {
                    return dispatch(errorDetailsSet(responseJson.error));
                }
            })
    }
};

export const loadRouteFromURL = () => {
    return async function(dispatch, getState) {
        // ReactGA.send({ hitType: "pageview", page: "/loadRoute" });
        // ReactGA.event('login', {method:getState().uiInfo.routeParams.rwgpsRoute});
        await dispatch(loadingFromUrlSet(true))
        await dispatch(loadFromRideWithGps())
        const error = getState().uiInfo.dialogParams.errorDetails
        if (getState().uiInfo.routeParams.stopAfterLoad) {
            ReactGA.event('search', {search_term:getState().uiInfo.routeParams.rwgpsRoute})
        }
        if (error === null && !getState().uiInfo.routeParams.stopAfterLoad) {
            await dispatch(requestForecast(getState().routeInfo));
            // updateHistory(getState().params.queryString, getState().params.searchString);
            const url = getState().params.queryString
            if (!url.includes("localhost")) {
                await dispatch(shortenUrl(url))
            }

        }
        dispatch(loadingFromUrlSet(false))
    }
}

export const SET_STOP_AFTER_LOAD = 'STOP_AFTER_LOAD';
export const setStopAfterLoad = (stopAfterLoad) => {
    return {
        type: SET_STOP_AFTER_LOAD,
        value: stopAfterLoad
    }
};

export const loadGpxRoute = function(event) {
    return async function (dispatch) {
        let gpxFiles = event.target.files;
        if (gpxFiles.length > 0) {
            dispatch(routeLoadingBegun('gpx'));
            const parser = await getRouteParser().catch((err) => {dispatch(gpxRouteLoadingFailed(err));return null});
            // handle failed load, error has already been dispatched
            if (parser == null) {
                return Promise.resolve(Error('Cannot load parser'));
            }
            parser.loadGpxFile(gpxFiles[0]).then( gpxData => {
                    dispatch(gpxRouteLoaded(gpxData));
                }, error => dispatch(gpxRouteLoadingFailed(error))
            );
        }
        else {
            dispatch(routeDataCleared());
        }
    }
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

export const RESET = 'RESET';
export const reset = () => {return {type:RESET}};

export const setWeatherProvider = (weatherProvider) => {
    return function(dispatch) {
        dispatch(weatherProviderSet(weatherProvider));
        dispatch(cancelForecast());
    }
}

export const SET_ADJUSTED_FORECAST_TIME = 'SET_ADJUSTED_FORECAST_TIME'
export const setAdjustedForecastTime = (index, value) => {
    return {type:SET_ADJUSTED_FORECAST_TIME, index:index, value:value};
}
