import { paceSet } from "./routeParamsSlice";
import { forecastInvalidated, weatherProviderSet } from "./forecastSlice";
import { intervalSet, startTimeSet, initialStartTimeSet } from "./routeParamsSlice"
import { UserControl, userControlsUpdated } from "./controlsSlice";
import { shortUrlSet, errorDetailsSet } from "./dialogParamsSlice";
import type { Dispatch, Action } from "redux";
import {controlsMeaningfullyDifferent} from "../utils/util"
import type { RootState } from "../redux/store";
import type { AppDispatch } from "../redux/store";
import * as Sentry from "@sentry/react";
const { trace, debug, info, warn, error, fatal, fmt } = Sentry.logger;
import { cancelForecast } from "./forecastActions";

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

/*
 * @param {String} url the URL to shortern
 * @returns {function(*=, *): Promise<T | never>} return value
 */
export const shortenUrl = function (url : string) {
    return function (dispatch : AppDispatch) {
        return Sentry.startSpan({ name: "shortenUrl" }, () => {
            return fetch("/short_io",
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify({ longUrl: url })
                })
                .then(response => response.json())
                .catch(err => { error(`Error fetching short URL: ${err}`); return errorDetailsSet(err) })
                .then(responseJson => {
                    if (responseJson.error === null) {
                        return dispatch(shortUrlSet(responseJson.url));
                    } else {
                        error(`Error fetching short URL: ${responseJson.error}`); 
                        return dispatch(errorDetailsSet(responseJson.error));
                    }
                })
        })
    }
};


