import type { RootState } from "../redux/store";
import type { AppDispatch } from "../redux/store";
import ReactGA from "react-ga4";
import { forecastFetchBegun, errorMessageListSet, forecastFetchFailed, forecastFetchCanceled, errorMessageListAppend } from "./dialogParamsSlice";
import { forecastFetched, forecastAppended, Forecast, forecastInvalidated } from "./forecastSlice";
import {getRwgpsRouteName, getRouteNumberFromValue} from "../utils/util"
import { RwgpsRoute, RwgpsTrip } from "./routeInfoSlice";
import { MutationWrapper } from "./loadRouteActions";
import { getForecastRequest } from "../utils/util";
import { ForecastRequest } from "../utils/gpxParser";
import { Action, Dispatch } from "@reduxjs/toolkit";

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

export const msgFromError = (error : {reason:{data:{details:string}} | {reason:string, data: never}}) => {
    if (error.reason.data !== undefined) {
        return error.reason.data.details
    } else {
        return JSON.stringify(error.reason)
    }
}

type abmtype = (reason?:any) => void
type abortMethodType = abmtype | null
let fetchAbortMethod : abortMethodType = null

export const cancelForecast = () => {
    return function(dispatch : Dispatch<Action<"forecast/forecastInvalidated">>) {
        const cancel : abortMethodType = fetchAbortMethod
        if (cancel !== null) {
            const cancelMethod : abmtype = cancel
            cancelMethod()
        }
        dispatch(forecastInvalidated())
    }
}

const forecastByParts = (forecastFunc : MutationWrapper, aqiFunc : MutationWrapper, 
    forecastRequest : Array<ForecastRequest>, zone : string, service : string, 
    routeName : string, routeNumber : string, dispatch : AppDispatch, fetchAqi : boolean,
    lang: string) => {
    let requestCopy = [...forecastRequest]
    let forecastResults = []
    let aqiResults = []
    let locations = requestCopy.shift();
    let which = 0
    while (requestCopy.length >= 0 && locations) {
        try {
            const request = {locations:locations, timezone:zone, service:service, routeName:routeName, routeNumber:routeNumber, lang:lang, which}
            const result = forecastFunc(request).unwrap()
            result.catch(() => { /* Handled by Promise.allSettled */ });
            forecastResults.push(result)
            if (fetchAqi) {
                const aqiRequest = {locations:locations}
                const aqiResult = aqiFunc(aqiRequest).unwrap()
                aqiResult.catch(() => { /* Handled by Promise.allSettled */ });
                aqiResults.push(aqiResult)
            }
        locations = requestCopy.shift();
            ++which
        } catch (err :any) {
            dispatch(forecastFetchFailed(err))
        }
    }
    return [Promise.allSettled(forecastResults),fetchAqi?Promise.allSettled(aqiResults):[]]
}

const doForecastByParts = (forecastFunc : MutationWrapper, aqiFunc : MutationWrapper,
     dispatch : AppDispatch, getState : () => RootState, lang : string) => {
    const type = ((getState().routeInfo.rwgpsRouteData !== null) ? "rwgps" : "gpx")
    const routeNumber = (type === "rwgps") ? getState().uiInfo.routeParams.rwgpsRoute : getState().strava.route
    const rwgpsRouteData = getState().routeInfo.rwgpsRouteData
    const gpxRouteData = getState().routeInfo.gpxRouteData
    const routeData = rwgpsRouteData ? rwgpsRouteData : (gpxRouteData ? gpxRouteData : null)
    if (!routeData) {
        return [Promise.allSettled([new Promise<{result: "error"}>((resolve, reject) => {
            reject({data:{details:"Missing any route data, cannot perform forecast"}})
        })

        ]),[]]
    }
    const forecastRequest = getForecastRequest(routeData,
         getState().uiInfo.routeParams.startTimestamp,
        getState().uiInfo.routeParams.zone, getState().uiInfo.routeParams.pace,
        getState().uiInfo.routeParams.interval, getState().controls.userControlPoints,
        getState().uiInfo.routeParams.segment, getState().routeInfo.routeUUID
    )
    return forecastByParts(forecastFunc, aqiFunc, forecastRequest, getState().uiInfo.routeParams.zone,
        getState().forecast.weatherProvider, getState().routeInfo.name, routeNumber, dispatch,
        getState().forecast.fetchAqi, lang)
}

export const removeDuplicateForecasts = (results : Array<{forecast:Forecast}>) => {
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
    for (let i = 0; i < results.length; ++i) {
        if (!resultsToRemove.includes(i)) {
            deduplicatedResults.push(results[i])
        }
    }
    return deduplicatedResults
}

export function extractRejectedResults<T>(results: PromiseSettledResult<T>[]): PromiseRejectedResult[] {
    return results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
}    

export const forecastWithHook = async (forecastFunc: MutationWrapper, aqiFunc: MutationWrapper,
     dispatch: AppDispatch, getState: () => RootState, lang: string) => {
    const routeInfo = getState().routeInfo

    if (routeInfo.rwgpsRouteData) {
        ReactGA.event('add_payment_info', {
            value: getRouteDistanceInKm(routeInfo.rwgpsRouteData), coupon: getRwgpsRouteName(routeInfo.rwgpsRouteData),
            currency: getRouteId(routeInfo.rwgpsRouteData),
            items: [{ item_id: '', item_name: '' }]
        });
    } else if (routeInfo.gpxRouteData) {
        ReactGA.event('add_payment_info', {
            value: routeInfo.gpxRouteData.tracks[0].distance.total/1000, coupon: routeInfo.gpxRouteData.name,
            currency: getRouteNumberFromValue(routeInfo.gpxRouteData.tracks[0].link?routeInfo.gpxRouteData.tracks[0].link.href:''),
            items: [{ item_id: '', item_name: '' }]
        });
    }

    const fetchController = new AbortController()
    const abortMethod = fetchController.abort.bind(fetchController)
    fetchAbortMethod = abortMethod;

    dispatch(forecastFetchBegun())
    const forecastAndAqiResults = doForecastByParts(forecastFunc, aqiFunc, dispatch, getState, lang)
    const forecastResults = await forecastAndAqiResults[0]
    const aqiResults = await forecastAndAqiResults[1]
    let filteredResults = forecastResults.filter(result => result.status === "fulfilled").map(result => (result as PromiseFulfilledResult<{forecast:Forecast}>).value)
    filteredResults.sort((l, r) => l.forecast.distance - r.forecast.distance)
    filteredResults = removeDuplicateForecasts(filteredResults)
    let filteredAqi = aqiResults.filter(result => result.status === "fulfilled").map(result => (result as PromiseFulfilledResult<{aqi:{aqi:number}}>).value)
    const firstForecastResult = filteredResults.shift()
    if (firstForecastResult) {
        const firstForecast = { ...firstForecastResult.forecast }
        if (filteredAqi.length > 0) {
            firstForecast.aqi = filteredAqi.shift()!.aqi.aqi
        }
        dispatch(forecastFetched({ forecastInfo: { forecast: [firstForecast] }, timeZoneId: getState().uiInfo.routeParams.zone }))
        while (filteredResults.length > 0) {
            const nextForecast = { ...filteredResults.shift()!.forecast }
            if (filteredAqi.length > 0) {
                nextForecast.aqi = filteredAqi.shift()!.aqi.aqi
            }
            dispatch(forecastAppended(nextForecast))
        }
    }
    fetchAbortMethod = null;

    // handle any errors
    dispatch(errorMessageListSet(extractRejectedResults(forecastResults).map(result => msgFromError(result))))
    dispatch(errorMessageListAppend(extractRejectedResults(aqiResults).map(result => msgFromError(result))))
}
