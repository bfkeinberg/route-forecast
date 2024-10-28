import { RootState } from "../jsx/app/topLevel";
import { AppDispatch } from "../jsx/app/topLevel";
import ReactGA from "react-ga4";
import { loadingFromUrlSet } from "./routeInfoSlice";
import { updateHistory } from "../jsx/app/updateHistory";
import * as Sentry from "@sentry/react";
import { routeLoadingBegun, rwgpsRouteLoadingFailed } from "./dialogParamsSlice";
import { loadRwgpsRoute } from '../utils/rwgpsUtilities';
import { rwgpsRouteLoaded } from "./routeInfoSlice";
import { extractControlsFromRoute } from "../utils/util";
import { displayControlTableUiSet, UserControl } from "./controlsSlice";
import { timeZoneSet } from "./routeParamsSlice";
import { updateUserControls, shortenUrl } from "./actions";
import { requestTimeZoneForRoute } from "../utils/forecastUtilities";
import { loadStravaRoute, loadStravaActivity } from "./loadFromStravaActions";
import { cancelForecast, forecastWithHook, requestForecast } from "./forecastActions";
import { DateTime } from "luxon";

const mergeControls = (oldCtrls : Array<UserControl>, newCtrls : Array<UserControl>) => {
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
    return merged
}

export const loadFromRideWithGps = function (routeNumber? : string, isTrip? : boolean) {
    return function (dispatch : AppDispatch, getState: () => RootState) {
        return Sentry.startSpan({ name: "loadingRwgpsRoute" }, () => {
            routeNumber = routeNumber || getState().uiInfo.routeParams.rwgpsRoute
            ReactGA.event('login', { method: routeNumber });
            isTrip = isTrip || getState().uiInfo.routeParams.rwgpsRouteIsTrip
            dispatch(routeLoadingBegun('rwgps'));
            dispatch(cancelForecast())
            return loadRwgpsRoute(routeNumber, isTrip, getState().rideWithGpsInfo.token).then(async (routeData) => {
                dispatch(rwgpsRouteLoaded(routeData));
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
                const routeInfo = getState().routeInfo
                if (routeInfo.type === null) {
                    return
                }
                const timeZoneResults = await requestTimeZoneForRoute(routeInfo,
                    DateTime.fromMillis(getState().uiInfo.routeParams.startTimestamp, { zone: getState().uiInfo.routeParams.zone }),
                    getState().params.timezone_api_key)
                if (timeZoneResults.result === "error") {
                    dispatch(rwgpsRouteLoadingFailed(timeZoneResults.error?timeZoneResults.error:"Unknown error fetching time zone"))
                } else {
                    Sentry.addBreadcrumb({category:'timezone',level:'info',message:`TimeZone API call returned ${timeZoneResults.result}`})
                    dispatch(timeZoneSet(timeZoneResults.result))
                }
            }, error => { return dispatch(rwgpsRouteLoadingFailed(error.message?error.message:error)) }
            );
        })
    };
};

export type MutationWrapper = (request:{}) => {unwrap: () => Promise<any>}

export const loadRouteFromURL = (forecastFunc : MutationWrapper, aqiFunc : MutationWrapper) => {
    return async function(dispatch : AppDispatch, getState: () => RootState) {
        // ReactGA.send({ hitType: "pageview", page: "/loadRoute" });
        // ReactGA.event('login', {method:getState().uiInfo.routeParams.rwgpsRoute});
        await dispatch(loadingFromUrlSet(true))
        if (getState().uiInfo.routeParams.rwgpsRoute !== '') {
            await dispatch(loadFromRideWithGps())
        } else if (getState().strava.route !== '') {
            await dispatch(loadStravaRoute(getState().strava.route))
        } else if (getState().uiInfo.routeParams.rusaPermRouteId !== '') {
            
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
            const queryString = getState().params.queryString
            const searchString = getState().params.searchString
            if (queryString && searchString) {
                updateHistory(queryString, searchString, true);
            }
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