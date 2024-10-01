import * as Sentry from "@sentry/react";
import queryString from 'query-string'
import cookie from 'react-cookies';
import ReactGA from "react-ga4";

import { updateHistory } from "../jsx/app/updateHistory";
import { doForecast, requestTimeZoneForRoute } from '../utils/forecastUtilities';
import { loadRwgpsRoute } from '../utils/rwgpsUtilities';
import { controlsMeaningfullyDifferent, extractControlsFromRoute, getForecastRequest,getRouteNumberFromValue, parseControls } from '../utils/util';
import { displayControlTableUiSet,     errorDetailsSet,forecastAppended,forecastFetchBegun, forecastFetchCanceled,
forecastFetched, forecastFetchFailed, forecastInvalidated, gpxRouteLoaded, gpxRouteLoadingFailed,     initialStartTimeSet, intervalSet, loadingFromUrlSet,
paceSet,     routeLoadingBegun, rwgpsRouteLoaded,     rwgpsRouteLoadingFailed, shortUrlSet,
startTimeSet,
stravaActivitySet, errorMessageListSet,
stravaErrorSet, stravaFetchBegun, stravaFetched, stravaFetchFailed,
    stravaTokenSet, timeZoneSet, userControlsUpdated, weatherProviderSet } from './reducer';

export const componentLoader = (lazyComponent, attemptsLeft) => {
    return new Promise((resolve, reject) => {
        Sentry.addBreadcrumb({category:'loading',level:'info',message:'in component loader'})
        return lazyComponent
            .then(resolve)
            .catch((error)=>{
                // let us retry after 1500 ms
                setTimeout(() => {
                    if (attemptsLeft === 1) {
                        // instead of rejecting reload the window
                        Sentry.captureException(error);
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
    Sentry.addBreadcrumb({
        category: 'load',
        level: 'info',
        message:'Loading GPX parser module'
    })

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
                ReactGA.event('add_payment_info', {
                    value: getRouteDistanceInKm(routeInfo.rwgpsRouteData), coupon:getRouteName(routeInfo.rwgpsRouteData),
                    currency:getRouteId(routeInfo.rwgpsRouteData),
                    items: [{ item_id:'', item_name:''}]
                });
            } else if (routeInfo.gpxData) {
                ReactGA.event('add_payment_info', {
                    value: routeInfo.gpxRouteData.tracks[0].distance.total, coupon:routeInfo.gpxRouteData.name,
                    currency:getRouteNumberFromValue(routeInfo.gpxRouteData.tracks[0].link),
                    items: [{item_id:'', item_name:''}]
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

const mergeControls = (oldCtrls, newCtrls) => {
    let oldCtrlsCopy = oldCtrls.slice()
    let old = oldCtrlsCopy.shift()
    const merged = newCtrls.map(ctrl => {
        if (old && ctrl.distance === old.distance) {
            const result =  {name:ctrl.name, distance:ctrl.distance, duration:old.duration}
            old = oldCtrlsCopy.shift()
            return result
        } else {
            return ctrl
        }
    })
    // add in any old controls that are not present
    while (old) {
        merged.push(old)
        old = oldCtrlsCopy.shift()
    }
    return merged
}

export const loadFromRideWithGps = function (routeNumber, isTrip) {
    return function (dispatch, getState) {
        return Sentry.startSpan({ name: "loadingRwgpsRoute" }, () => {
            routeNumber = routeNumber || getState().uiInfo.routeParams.rwgpsRoute
            ReactGA.event('login', { method: routeNumber });
            isTrip = isTrip || getState().uiInfo.routeParams.rwgpsRouteIsTrip
            dispatch(routeLoadingBegun('rwgps'));
            dispatch(cancelForecast())
            return loadRwgpsRoute(routeNumber, isTrip, getState().rideWithGpsInfo.token).then(async (routeData) => {
                dispatch(rwgpsRouteLoaded(routeData));
                // if (getState().controls.userControlPoints.length === 0) {
                    const extractedControls = extractControlsFromRoute(routeData);
                    if (extractedControls.length !== 0) {
                        const oldControls = getState().controls.userControlPoints
                        if (oldControls.length === 0) {
                            dispatch(updateUserControls(extractedControls))
                        } else {
                            const merged = mergeControls(oldControls, extractedControls)
                            dispatch(updateUserControls(merged))
                        }
                        dispatch(displayControlTableUiSet(true))
                    }
                // }
                const timeZoneResults = await requestTimeZoneForRoute(getState())
                if (timeZoneResults.result === "error") {
                    dispatch(rwgpsRouteLoadingFailed(timeZoneResults.error))
                } else {
                    Sentry.addBreadcrumb({category:'timezone',level:'info',message:`TimeZone API call returned ${timeZoneResults.result}`})
                    dispatch(timeZoneSet(timeZoneResults.result))
                }
            }, error => { return dispatch(rwgpsRouteLoadingFailed(error.message?error.message:error)) }
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
        Sentry.metrics.increment('loadStravaRoute', 1)
        dispatch(routeLoadingBegun('gpx'));
        await Sentry.startSpan({ name: "loadingStravaRoute" }, async () => {
            const api = new Api('https://www.strava.com/api/v3', [(response) => Promise.resolve(response.text())])
            const access_token = await dispatch(refreshOldToken)
            if (!access_token) {
                authenticate(routeId)
            }
            api.setDefaultHeader('Authorization', `Bearer ${access_token}`)
            try {
                const routeInfo = await api.get(`/routes/${routeId}/export_gpx`)
                if (routeInfo && routeInfo.charAt(0)!=="{") {
                    await dispatch(loadGpxRoute(routeInfo))
                } else {
                    dispatch(errorDetailsSet(`Error fetching Strava route: ${JSON.parse(routeInfo).message}`))
                }    
            } catch (err) {
                dispatch(errorDetailsSet(`Error fetching Strava route: ${err.details}`))
            }
        })
    }
}

const forecastByParts = (forecastFunc, aqiFunc, forecastRequest, zone, service, routeName, routeNumber, dispatch, fetchAqi) => {
    let requestCopy = Object.assign(forecastRequest)
    let forecastResults = []
    let aqiResults = []
    let locations = requestCopy.shift();
    let which = 0
    while (requestCopy.length >= 0 && locations) {
        try {
            const request = {locations:locations, timezone:zone, service:service, routeName:routeName, routeNumber:routeNumber, which}
            const result = forecastFunc(request).unwrap()
            forecastResults.push(result)
            if (fetchAqi) {
                const aqiRequest = {locations:locations}
                const aqiResult = aqiFunc(aqiRequest).unwrap()
                aqiResults.push(aqiResult)
            }
        locations = requestCopy.shift();
            ++which
        } catch (err) {
            dispatch(forecastFetchFailed(err))
        }
    }
    return [Promise.allSettled(forecastResults),fetchAqi?Promise.allSettled(aqiResults):[]]
}

const doForecastByParts = (forecastFunc, aqiFunc, dispatch, getState) => {
    const type = ((getState().routeInfo.rwgpsRouteData !== null) ? "rwgps" : "gpx")
    const routeNumber = (type === "rwgps") ? getState().uiInfo.routeParams.rwgpsRoute : getState().strava.route
    const forecastRequest = getForecastRequest(((type === "rwgps") ? getState().routeInfo.rwgpsRouteData : getState().routeInfo.gpxRouteData),
         getState().uiInfo.routeParams.startTimestamp,
        type, getState().uiInfo.routeParams.zone, getState().uiInfo.routeParams.pace,
        getState().uiInfo.routeParams.interval, getState().controls.userControlPoints,
        getState().uiInfo.routeParams.segment
    )
    if (forecastRequest === undefined) {
        return { result: "error", error: "No route could be loaded" }
    }
    return forecastByParts(forecastFunc, aqiFunc, forecastRequest, getState().uiInfo.routeParams.zone,
        getState().forecast.weatherProvider, getState().routeInfo.name, routeNumber, dispatch,
        getState().forecast.fetchAqi)
}

export const msgFromError = (error) => {
    if (error.reason.data !== undefined) {
        return error.reason.data.details
    } else {
        return JSON.stringify(error.reason)
    }
}

export const removeDuplicateForecasts = (results) => {
    let deduplicatedResults = []
    let resultsToRemove = []
    for (let i = 0; i < results.length-1; ++i) {
        if (results[i].forecast.time===results[i+1].forecast.time) {
            if (results[i].forecast.isControl) {
                resultsToRemove.push(i+1)
            } else {
                resultsToRemove.push(i)
            }
        }
    }
    for (let i = 0; i < results.length-1; ++i) {
        if (!resultsToRemove.includes(i)) {
            deduplicatedResults.push(results[i])
        }
    }
    return deduplicatedResults
}

const forecastWithHook = async (forecastFunc, aqiFunc, dispatch, getState) => {
    // await Sentry.startSpan({ name: "forecastWithHook" }, async () => {
        const routeInfo = getState().routeInfo

        if (routeInfo.rwgpsRouteData) {
            ReactGA.event('add_payment_info', {
                value: getRouteDistanceInKm(routeInfo.rwgpsRouteData), coupon:getRouteName(routeInfo.rwgpsRouteData),
                currency:getRouteId(routeInfo.rwgpsRouteData),
                items: [{ item_id: '', item_name: '' }]
            });
        } else if (routeInfo.gpxData) {
            ReactGA.event('add_payment_info', {
                value: routeInfo.gpxRouteData.tracks[0].distance.total,  coupon:routeInfo.gpxRouteData.name,
                currency:getRouteNumberFromValue(routeInfo.gpxRouteData.tracks[0].link),
                items: [{ item_id: '', item_name: '' }]
            });
        }

        dispatch(forecastFetchBegun())
        const forecastAndAqiResults = doForecastByParts(forecastFunc, aqiFunc, dispatch, getState)
        const forecastResults = await forecastAndAqiResults[0]
        const aqiResults = await forecastAndAqiResults[1]
        let filteredResults = forecastResults.filter(result => result.status === "fulfilled").map(result => result.value)
        filteredResults.sort((l,r) => l.forecast.distance-r.forecast.distance)
        filteredResults = removeDuplicateForecasts(filteredResults)
        let filteredAqi = aqiResults.filter(result => result.status === "fulfilled").map(result => result.value)
        const firstForecastResult = filteredResults.shift()
        if (firstForecastResult) {
            const firstForecast = { ...firstForecastResult.forecast }
            if (filteredAqi.length > 0) {
                firstForecast.aqi = filteredAqi.shift().aqi.aqi
            }
            dispatch(forecastFetched({ forecastInfo: { forecast: [firstForecast] }, timeZoneId: getState().uiInfo.routeParams.zone }))
            while (filteredResults.length > 0) {
                const nextForecast = {...filteredResults.shift().forecast}
                if (filteredAqi.length > 0) {
                    nextForecast.aqi = filteredAqi.shift().aqi.aqi
                }
            dispatch(forecastAppended(nextForecast))
            }
        }
        // handle any errors
        dispatch(errorMessageListSet(forecastResults.filter(result => result.status === 'rejected').map(result => msgFromError(result))))
        dispatch(errorMessageListSet(aqiResults.filter(result => result.status === 'rejected').map(result => msgFromError(result))))
    // })
}

export const loadRouteFromURL = (forecastFunc, aqiFunc) => {
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
            if (forecastFunc && aqiFunc) {
                await forecastWithHook(forecastFunc, aqiFunc, dispatch, getState)
            } else {
                await dispatch(requestForecast(getState().routeInfo));
            }
            updateHistory(getState().params.queryString, getState().params.searchString, true);
            const url = getState().params.queryString
            if (url && !url.includes("localhost")) {
                await dispatch(shortenUrl(url))
            }
            if (getState().strava.activity && getState().strava.activity !== '') {
                dispatch(loadStravaActivity())
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
        Sentry.metrics.increment('loadStravaActivity', 1)
        const activityId = getState().strava.activity
        return parser.fetchStravaActivity(activityId, access_token).then(result => {
            dispatch(stravaFetched(result));
        }).catch(error => {
            dispatch(stravaFetchFailed(error));
            dispatch(stravaActivitySet(''))
        });

    }
};

export const setWeatherProvider = (weatherProvider) => {
    return function(dispatch) {
        dispatch(weatherProviderSet(weatherProvider));
        dispatch(cancelForecast());
    }
}
