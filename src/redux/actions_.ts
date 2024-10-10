import { paceSet } from "./routeParamsSlice";
import { forecastInvalidated, weatherProviderSet, forecastFetched } from "./forecastSlice";
import { intervalSet, startTimeSet, initialStartTimeSet } from "./routeParamsSlice"
import { UserControl, userControlsUpdated } from "./controlsSlice";
import { shortUrlSet, forecastFetchBegun, forecastFetchCanceled, forecastFetchFailed, errorDetailsSet } from "./dialogParamsSlice";
import type { Dispatch, Action } from "redux";
import {controlsMeaningfullyDifferent, getRwgpsRouteName, getRouteNumberFromValue} from "../utils/util"
import { RootState } from "../jsx/app/topLevel";
import { AppDispatch } from "../jsx/app/topLevel";
import * as Sentry from "@sentry/react";
import ReactGA from "react-ga4";
import type { RouteInfoState, RwgpsRoute, RwgpsTrip } from "./routeInfoSlice"
import {doForecast} from '../utils/forecastUtilities'

type abmtype = (reason?:any) => void
type abortMethodType = abmtype | null
let fetchAbortMethod : abortMethodType = null

const cancelForecast = () => {
    return function(dispatch : Dispatch<Action<"forecast/forecastInvalidated">>) {
        const cancel : abortMethodType = fetchAbortMethod
        if (cancel !== null) {
            const cancelMethod : abmtype = cancel
            cancelMethod()
        }
        dispatch(forecastInvalidated())
    }
}

export const setPace = function (pace : string) {
    return function(dispatch : AppDispatch) {
        dispatch(paceSet(pace));
        dispatch(cancelForecast())
    }
}

export const setTimeFromIso = (startAsIso : string, zone : string) => {
    return function(dispatch : Dispatch<Action<string>>) {
        dispatch(initialStartTimeSet({start:startAsIso,zone:zone}))
        dispatch(forecastInvalidated())
    }
}
export const setStart = function (start : number) {
    return function(dispatch : AppDispatch) {
        dispatch(startTimeSet(start))
        dispatch(cancelForecast())
    }
};

export const setInterval = function (interval : number) {
    return function(dispatch : AppDispatch) {
        dispatch(intervalSet(interval))
        dispatch(cancelForecast())
    }
};

export const updateUserControls = function(controls : Array<UserControl>) {
    return function(dispatch : AppDispatch, getState : () => RootState) {
        const different = controlsMeaningfullyDifferent(controls, getState().controls.userControlPoints)
        dispatch(userControlsUpdated(controls))
        if (different) {
            dispatch(cancelForecast())
        }
    }
};

export const setWeatherProvider = (weatherProvider : string) => {
    return function(dispatch : AppDispatch) {
        dispatch(weatherProviderSet(weatherProvider));
        dispatch(cancelForecast())
    }
}

const getRouteDistanceInKm = (routeData : RwgpsRoute|RwgpsTrip) => {
    if (routeData.route !== undefined) {
        return routeData.route.distance/1000;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.distance/1000;
    } else {
        return null;
    }
}

const getRouteId = (routeData : RwgpsRoute|RwgpsTrip) => {
    if (routeData.route !== undefined) {
        return routeData.route.id;
    } else if (routeData.trip !== undefined) {
        return routeData.trip.id;
    } else {
        return null;
    }
};

export const requestForecast = function (routeInfo : RouteInfoState) {
    return async function (dispatch : AppDispatch, getState : () => RootState) {
        await Sentry.startSpan({ name: "requestForecast" }, async () => {
            if (routeInfo.rwgpsRouteData) {
                ReactGA.event('add_payment_info', {
                    value: getRouteDistanceInKm(routeInfo.rwgpsRouteData), coupon:getRwgpsRouteName(routeInfo.rwgpsRouteData),
                    currency:getRouteId(routeInfo.rwgpsRouteData),
                    items: [{ item_id:'', item_name:''}]
                });
            } else if (routeInfo.gpxRouteData) {
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
            if (result === "success" && value) {
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

/*
 * @param {String} url the URL to shortern
 * @returns {function(*=, *): Promise<T | never>} return value
 */
export const shortenUrl = function (url : string) {
    return function (dispatch : AppDispatch) {
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
