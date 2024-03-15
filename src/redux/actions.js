import cookie from 'react-cookies';
import { doForecast, requestTimeZoneForRoute } from '../utils/forecastUtilities';
import { loadRwgpsRoute } from '../utils/rwgpsUtilities';
import { controlsMeaningfullyDifferent, parseControls, extractControlsFromRoute, getRouteNumberFromValue } from '../utils/util';
import ReactGA from "react-ga4";
import queryString from 'query-string'
import * as Sentry from "@sentry/react";
import { updateHistory } from "../jsx/app/updateHistory";
import { userControlsUpdated, displayControlTableUiSet, rwgpsRouteLoaded, loadingFromUrlSet,
    routeLoadingBegun, forecastFetchBegun, forecastFetched, forecastFetchFailed, forecastFetchCanceled,
    rwgpsRouteLoadingFailed, gpxRouteLoaded, gpxRouteLoadingFailed, shortUrlSet,
    errorDetailsSet,weatherProviderSet, intervalSet, paceSet, forecastInvalidated, startTimeSet,
    stravaTokenSet, stravaErrorSet, stravaFetchBegun, stravaFetched, stravaFetchFailed,
    initialStartTimeSet, timeZoneSet } from './reducer';

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

export const setTimeFromIso = (startAsIso,zone) => {
    return function(dispatch) {
        dispatch(initialStartTimeSet({start:startAsIso,zone:zone}))
        dispatch(forecastInvalidated())
    }
}

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

export const requestForecast = function (routeInfo) {
    return async function (dispatch, getState) {
        await Sentry.startSpan({ name: "requestForecast" }, async () => {
            if (routeInfo.rwgpsRouteData) {
                ReactGA.event('add_to_cart', {
                    value: getRouteDistanceInKm(routeInfo.rwgpsRouteData),
                    items: [{ item_id: getRouteId(routeInfo.rwgpsRouteData), item_name: getRouteName(routeInfo.rwgpsRouteData) }]
                });
            } else if (routeInfo.gpxData) {
                ReactGA.event('add_to_cart', {
                    value: routeInfo.gpxRouteData.tracks[0].distance.total,
                    items: [{ item_id: getRouteNumberFromValue(routeInfo.gpxRouteData.tracks[0].link), item_name: routeInfo.gpxRouteData.name }]
                });
            }
            const fetchController = new AbortController()
            const abortMethod = fetchController.abort.bind(fetchController)
            fetchAbortMethod = abortMethod;
            dispatch(forecastFetchBegun());
            const { result, value, error } = await doForecast(getState(), fetchController.signal);
            fetchAbortMethod = null;
            if (result === "success") {
                const { forecast, timeZoneId } = value
                dispatch(forecastFetched({ forecastInfo: forecast, timeZoneId: timeZoneId }));
            } else if (result === "error") {
                dispatch(forecastFetchFailed(error));
            } else {
                dispatch(forecastFetchCanceled());
            }
        })
    }
};

export const loadFromRideWithGps = function (routeNumber, isTrip) {
    return function (dispatch, getState) {
        return Sentry.startSpan({ name: "loadingRwgpsRoute" }, () => {
            routeNumber = routeNumber || getState().uiInfo.routeParams.rwgpsRoute
            ReactGA.event('login', { method: routeNumber });
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
                requestTimeZoneForRoute(getState()).then((results) => {
                    if (results.result === "error") {
                        dispatch(rwgpsRouteLoadingFailed(results.error))
                    } else {
                        dispatch(timeZoneSet(results.result))
                    }
                }
                )
            }, error => { return dispatch(rwgpsRouteLoadingFailed(error.message)) }
            );
        })
    };
};

/*
 * @param {String} url the URL to shortern
 * @returns {function(*=, *): Promise<T | never>} return value
 */
export const shortenUrl = function (url) {
    return function (dispatch) {
        return Sentry.startSpan({ name: "shortenUrl" }, () => {
            return fetch("/bitly",
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify({ longUrl: url })
                })
                .then(response => response.json())
                .catch(error => { return errorDetailsSet(error) })
                .then(responseJson => {
                    if (responseJson.error === null) {
                        return dispatch(shortUrlSet(responseJson.url));
                    } else {
                        return dispatch(errorDetailsSet(responseJson.error));
                    }
                })
        })
    }
};

import { Api } from 'rest-api-handler';

export const loadGpxRoute = function(gpxFileData) {
    return async function (dispatch) {
        const parser = await getRouteParser().catch((err) => {dispatch(gpxRouteLoadingFailed(err));return null});
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'))
        }
        const parsedResults = parser.loadGpxFile(gpxFileData)
        if (parsedResults.gpxData) {
            dispatch(gpxRouteLoaded(parsedResults.gpxData));
        } else if (parsedResults.error) {
            dispatch(gpxRouteLoadingFailed(parsedResults.error))
        }
    }
}

const stravaTokenTooOld = (getState) => {
    if (getState().strava.expires_at == null) {
        return false;
    }
    return (getState().strava.expires_at < Math.round(Date.now()/1000));
};

export const refreshOldToken = (dispatch, getState) => {
    if (stravaTokenTooOld(getState)) {
        return new Promise((resolve, reject) => {
            fetch(`/refreshStravaToken?refreshToken=${getState().strava.refresh_token}`).then(response => {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(response => {
                if (response === undefined) {
                    dispatch(stravaErrorSet(Error("Received undefined response from Strava auth service")));
                    reject(Error("Received undefined response from Strava auth service"));
                }
                else {
                    dispatch(stravaTokenSet(response.access_token, response.expires_at));
                    resolve(response.access_token);
                }
            }, error => {
                dispatch(stravaErrorSet(error));
                reject(error);
            });
        });
    } else {
        return new Promise((resolve) => {resolve(getState().strava.access_token)});
    }
}

const authenticate = (routeId) => {
    let params = queryString.parse(location.search);
    params['strava_route'] = routeId;
    window.location.href = '/stravaAuthReq?state=' + encodeURIComponent(JSON.stringify(params));
}

export const loadStravaRoute = (routeId) => {
    return async function (dispatch, getState) {
        routeId = routeId || getState().strava.route
        ReactGA.event('login', {method:routeId});
        ReactGA.event('sign_up', {method:routeId});
        dispatch(routeLoadingBegun('gpx'));
        await Sentry.startSpan({ name: "loadingStravaRoute" }, async () => {
            const api = new Api('https://www.strava.com/api/v3', [(response) => Promise.resolve(response.text())])
            const access_token = await dispatch(refreshOldToken)
            if (!access_token) {
                authenticate(routeId)
            }
            api.setDefaultHeader('Authorization', `Bearer ${access_token}`)
            const routeInfo = await api.get(`/routes/${routeId}/export_gpx`)
            if (routeInfo && routeInfo.charAt(0)!=="{") {
                await dispatch(loadGpxRoute(routeInfo))
            } else {
                dispatch(errorDetailsSet(`Error fetching Strava route: ${JSON.parse(routeInfo).message}`))
            }
        })
    }
}

export const loadRouteFromURL = () => {
    return async function(dispatch, getState) {
        // ReactGA.send({ hitType: "pageview", page: "/loadRoute" });
        // ReactGA.event('login', {method:getState().uiInfo.routeParams.rwgpsRoute});
        await dispatch(loadingFromUrlSet(true))
        if (getState().uiInfo.routeParams.rwgpsRoute !== '') {
            await dispatch(loadFromRideWithGps())
        } else {
            await dispatch(loadStravaRoute())
        }
        const error = getState().uiInfo.dialogParams.errorDetails
        if (getState().uiInfo.routeParams.stopAfterLoad) {
            ReactGA.event('search', {search_term:getState().uiInfo.routeParams.rwgpsRoute})
        }
        if (error === null && !getState().uiInfo.routeParams.stopAfterLoad) {
            await dispatch(requestForecast(getState().routeInfo));
            updateHistory(getState().params.queryString, getState().params.searchString, true);
            const url = getState().params.queryString
            if (url && !url.includes("localhost")) {
                await dispatch(shortenUrl(url))
            }

        }
        dispatch(loadingFromUrlSet(false))
    }
}

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

const getStravaParser = async function() {
    const parser = await import(/* webpackChunkName: "StravaRouteParser" */ '../utils/stravaRouteParser');
    return parser.default;
};

export const loadStravaActivity = function() {
    return async function (dispatch, getState) {
        const parser = await getStravaParser().catch((err) => {
            dispatch(stravaFetchFailed(err));
            return null
        });
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'));
        }

        const access_token = await refreshOldToken(dispatch, getState)
        dispatch(stravaFetchBegun());
        const activityId = getState().strava.activity
        return parser.fetchStravaActivity(activityId, access_token).then(result => {
            dispatch(stravaFetched(result));
        }).catch(error => {
            dispatch(stravaFetchFailed(error));
        });

    }
};

export const setWeatherProvider = (weatherProvider) => {
    return function(dispatch) {
        dispatch(weatherProviderSet(weatherProvider));
        dispatch(cancelForecast());
    }
}
