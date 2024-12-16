import "normalize.css/normalize.css";
import '@blueprintjs/core/lib/css/blueprint.css';
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import 'Images/style.css';

import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";
import {Info} from "luxon";
import queryString from 'query-string';
import React, {lazy,  ReactElement, Suspense,useEffect} from 'react';
import cookie from 'react-cookies';
import { useAppDispatch, useAppSelector } from "../../utils/hooks";
import { AppDispatch } from "./topLevel";
import  {useMediaQuery} from 'react-responsive';
import {useTranslation} from 'react-i18next'
import { stravaErrorSet } from "../../redux/dialogParamsSlice";
import { usePinnedRoutesSet, rwgpsTokenSet } from "../../redux/rideWithGpsSlice";
import { stravaActivitySet, stravaRefreshTokenSet, stravaRouteSet, stravaTokenSet } from "../../redux/stravaSlice";
import { apiKeysSet, querySet, actionUrlAdded } from "../../redux/paramsSlice";
import { fetchAqiSet, zoomToRangeSet } from "../../redux/forecastSlice";
import { stopAfterLoadSet, rusaPermRouteIdSet, routeLoadingModeSet, startTimestampSet, rwgpsRouteSet, reset } from "../../redux/routeParamsSlice";
import { metricSet, displayControlTableUiSet } from "../../redux/controlsSlice";
import { defaultProvider, providerValues } from "../../redux/providerValues";
import { DesktopUIProps } from "../DesktopUI";
const addBreadcrumb = (msg : string) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}
const reloadPage = () => {
    Sentry.addBreadcrumb({category:"No stack", level:"info", message:"reloadPage"})
    if (window && window["location"] && window.location["reload"]) {
        window.location.reload()
    }
}
  
type DesktopUIType = Promise<typeof import(/* webpackChunkName: "DesktopUI" */ '../DesktopUI')>
type DynamicDesktopUIType = DesktopUIType | Promise<{default:({ mapsApiKey, orientationChanged, setOrientationChanged }: DesktopUIProps) => ReactElement; }>
const LoadableDesktop = lazy(() : DynamicDesktopUIType => {addBreadcrumb('loading desktop UI'); return import( /* webpackChunkName: "DesktopUI" */'../DesktopUI').catch((error) => {
    setTimeout(() => reloadPage(), 5000);
    return { default: () => <div>{`Error ${error} loading the component. Window will reload in five seconds`}</div> };
})})
const LoadableMobile = lazy(() => {addBreadcrumb('loading mobile UI'); return import( /* webpackChunkName: "MobileUI" */'../MobileUI').catch((error) => {
    setTimeout(() => reloadPage(), 5000);
    return { default: () => <div>{`Error ${error} loading the component. Window will reload in five seconds`}</div> };
})})

import { routeLoadingModes } from '../../data/enums';
import { loadCookie, saveCookie } from "../../utils/util";
import {
    loadRouteFromURL,
    MutationWrapper,
} from "../../redux/loadRouteActions";
import { setPace, updateUserControls, setInterval, setWeatherProvider } from "../../redux/actions";
import { useForecastMutation, useGetAqiMutation } from '../../redux/forecastApiSlice';
import { inputPaceToSpeed,parseControls } from '../../utils/util';

const checkCredentialsInterface = () => {
    return 'PasswordCredential' in window &&
        "credentials" in navigator && "store" in navigator.credentials && "get" in navigator.credentials &&
        "password" in PasswordCredential && "name" in PasswordCredential
}

export const saveRwgpsCredentials = (token : string) => {
    Sentry.addBreadcrumb({
        category: 'rwgps',
        level: 'info',
        message:'Saving RidewithGPS login data'
    })

    if (checkCredentialsInterface() && token) {

        // eslint-disable-next-line no-undef
        let credential = new PasswordCredential({
            id: 'ridewithgps',
            name:'Ride With Gps',
            password:token
        });

        navigator.credentials.store(credential).then(() => {
        console.info("Rwgps login info stored by the user agent.");
        }, (err) => {
            Sentry.captureException(err)
            cookie.save('rwgpsToken', token, { path: '/' });
            console.info('RideWithGps login info stored in cookie');
            });
    } else {
        cookie.save('rwgpsToken', token, { path: '/' });
        console.info('RideWithGps login info stored in cookie');
    }
};

const loadAndStoreRwgpsCredentialsViaCookie = (dispatch : AppDispatch) => {
    const token = loadCookie("rwgpsToken");
    if (token) {
        dispatch(rwgpsTokenSet(token))
        saveRwgpsCredentials(token);
    }
}

const setupRideWithGps = async (dispatch : AppDispatch) => {
    Sentry.addBreadcrumb({
        category: 'rwgps',
        level: 'info',
        message:'Loading RidewithGPS login information'
    })
    let credentials = null;
    if (checkCredentialsInterface()) {
        try {
            credentials = await navigator.credentials.get({password:true,mediation:"silent"});
            if (credentials === null) {
                console.info('No rwgps login info retrieved, trying cookie');
                loadAndStoreRwgpsCredentialsViaCookie(dispatch)
            } else {
                console.info('Rwgps login info retrieved from manager');
                if ("password" in credentials && credentials.password) {
                    dispatch(rwgpsTokenSet(credentials.password))
                    saveRwgpsCredentials(credentials.password);    
                }
            }
        } catch (err) {
            console.info(`failed to load rwgps login info with ${err}`)
            Sentry.captureException(err)
            loadAndStoreRwgpsCredentialsViaCookie(dispatch)
    }
    } else {
        console.info('Login info manager not supported, retrieved from cookie');
        loadAndStoreRwgpsCredentialsViaCookie(dispatch)
    }
}

type QueryParams = {
    controlPoints: string
    strava_access_token?: string
    strava_refresh_token? : string
    strava_token_expires_at? : number
    provider: string
    interval: number
    rwgpsRoute: string
    startTimestamp: string
    zone: string
    pace: string
    metric: boolean
    strava_activity: string
    strava_route: string
    strava_error: string
    strava_analysis: boolean
    rusa_route_id: string
    rwgpsToken: string
    stopAfterLoad: boolean
}
const setupBrowserForwardBack = (dispatch : AppDispatch, origin : string, forecastFunc : MutationWrapper, aqiFunc : MutationWrapper) => {
    if (typeof window !== 'undefined') {
        window.onpopstate = (event) => {
            Sentry.addBreadcrumb({
                    category: 'history',
                    level: "info",
                    message: JSON.stringify(event.state),
                    data: document.location
                })
            if (event.state == null) {
                // clear the state when back button takes us past any saved routes
                dispatch(reset())
                Sentry.addBreadcrumb({
                    category: 'reset',
                    level: 'info',
                    message:'Moving back and resetting state'
                })
            } else {
                Sentry.addBreadcrumb({
                    category: 'reset',
                    level: 'info',
                    message:'Moving through history'
                })
                // reload previous or next route when moving throw browser history with forward or back buttons
                let queryParams = queryString.parse(event.state, {parseBooleans: true, parseNumbers:true});
                dispatch(querySet({url:`${origin}/?${event.state}`,search:event.state}))
                updateFromQueryParams(dispatch, queryParams as unknown as QueryParams);
                if (queryParams.rwgpsRoute !== undefined || queryParams.strava_route) {
                    dispatch(loadRouteFromURL(forecastFunc, aqiFunc))
                }
            }
        }
    }
}

const getStravaToken = (queryParams : QueryParams, dispatch : AppDispatch) => {
    if (queryParams.strava_access_token !== undefined && queryParams.strava_refresh_token && queryParams.strava_token_expires_at) {
        saveCookie('strava_access_token', queryParams.strava_access_token);
        saveCookie('strava_refresh_token', queryParams.strava_refresh_token);
        saveCookie('strava_token_expires_at', queryParams.strava_token_expires_at.toString());
        dispatch(stravaTokenSet({ token: queryParams.strava_access_token, expires_at: queryParams.strava_token_expires_at }))
        dispatch(stravaRefreshTokenSet(queryParams.strava_refresh_token))
        return queryParams.strava_access_token;
    } else {
        const stravaToken = loadCookie('strava_access_token');
        dispatch(stravaTokenSet({token:stravaToken, expires_at:loadCookie('strava_token_expires_at')}))
        dispatch(stravaRefreshTokenSet(loadCookie('strava_refresh_token')))
        return stravaToken;
    }
}

const hasProvider = (provider? : string) => {
    return provider && Object.keys(providerValues).includes(provider)
}

const hasZone = (zone? : string) => {
    return zone && Info.isValidIANAZone(zone);
}

const updateFromQueryParams = (dispatch : AppDispatch, queryParams : QueryParams) => {
    if (!queryParams) {
        return;
    }
    if (hasProvider(queryParams.provider)) {
        dispatch(setWeatherProvider(queryParams.provider))
    } else {
        dispatch(setWeatherProvider(defaultProvider))
    }
    dispatch(rwgpsRouteSet(queryParams.rwgpsRoute))
    getStravaToken(queryParams, dispatch);
    if (queryParams.startTimestamp) {
        if (hasZone(queryParams.zone)) {
            dispatch(startTimestampSet({ start: Number.parseInt(queryParams.startTimestamp), zone: queryParams.zone }))
        } else {
            dispatch(startTimestampSet({ start: Number.parseInt(queryParams.startTimestamp) }))
        }
    }
    if (queryParams.pace && inputPaceToSpeed[queryParams.pace.trim()]) {
        dispatch(setPace(queryParams.pace.trim()))
    } else {
        let lastPace = loadCookie("pace");
        if (lastPace) {
            dispatch(setPace(lastPace))
        }
    }
    dispatch(setInterval(queryParams.interval))
    dispatch(metricSet(queryParams.metric))
    dispatch(stravaActivitySet(queryParams.strava_activity))
    dispatch(stravaRouteSet(queryParams.strava_route))
    dispatch(stravaErrorSet(queryParams.strava_error))
    if (queryParams.strava_analysis !== undefined || queryParams.strava_route) {
        dispatch(routeLoadingModeSet(routeLoadingModes.STRAVA))
    }
    if (queryParams.rusa_route_id) {
        dispatch(rusaPermRouteIdSet(queryParams.rusa_route_id))
    }
    if (queryParams.rwgpsToken !== undefined) {
        dispatch(rwgpsTokenSet(queryParams.rwgpsToken))
        // if we have just received an auth token then we previously clicked show pinned routes
        dispatch(usePinnedRoutesSet(true))
        saveRwgpsCredentials(queryParams.rwgpsToken);
    }
    dispatch(stopAfterLoadSet(queryParams.stopAfterLoad))
}

interface RouteWeatherUIProps {
    search: string
    href: string
    action: string
    maps_api_key: string
    timezone_api_key: string
    bitly_token: string
    origin: string
}
const RouteWeatherUI = ({search, href, action, maps_api_key, timezone_api_key, bitly_token, origin} : RouteWeatherUIProps) => {
    const dispatch = useAppDispatch()
    const [forecast] = useForecastMutation()
    const [getAqi] = useGetAqiMutation()
    const { i18n } = useTranslation()

    let queryParams = queryString.parse(search, {parseBooleans: true, parseNumbers:false});
    const queryParamsAsObj = queryParams as unknown as QueryParams
    dispatch(querySet({url:href,search:search}))
    Sentry.setContext("query", {queryString:search})
    updateFromQueryParams(dispatch, queryParamsAsObj);
    dispatch(actionUrlAdded(action))
    dispatch(apiKeysSet({maps_api_key:maps_api_key,timezone_api_key:timezone_api_key, bitly_token:bitly_token}))
    setupRideWithGps(dispatch);
    setupBrowserForwardBack(dispatch, origin, forecast, getAqi)
    dispatch(updateUserControls(queryParams.controlPoints?parseControls(queryParamsAsObj.controlPoints, true):[]))
    const zoomToRange = loadCookie('zoomToRange');
    if (zoomToRange !== undefined) {
        dispatch(zoomToRangeSet(zoomToRange==="true"))
    }
    const fetchAqi = loadCookie('fetchAqi');
    if (fetchAqi) {
        dispatch(fetchAqiSet(fetchAqi==="true"))
    }
    if (i18n.language === 'fr') {
        ReactGA.event('tutorial_begin')
    }
    return (
        <FunAppWrapperThingForHooksUsability maps_api_key={maps_api_key} queryParams={queryParamsAsObj}/>
    )

}

export default React.memo(RouteWeatherUI)

const useLoadRouteFromURL = (queryParams : QueryParams, forecastFunc : MutationWrapper, aqiFunc : MutationWrapper) => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (queryParams.rwgpsRoute || queryParams.strava_route) {
            dispatch(loadRouteFromURL(forecastFunc, aqiFunc))
        }
    }, [queryParams])
}

const useLoadControlPointsFromURL = (queryParams: QueryParams) => {

    const dispatch = useAppDispatch()
    useEffect(() => {
        if (!("controlPoints" in queryParams) || queryParams.controlPoints === "") {
            dispatch(updateUserControls([]))
        } else {
            dispatch(updateUserControls(parseControls(queryParams.controlPoints, false)))
            dispatch(displayControlTableUiSet(true))
        }
    }, [queryParams])
}

const useSetPageTitle = () => {

    const routeInfo = useAppSelector(state => state.routeInfo)

    useEffect(() => {
        if (routeInfo.name !== '') {
            document.title = `Forecast for ${routeInfo.name}`;
        }
    }, [routeInfo.name])
}

interface FunWrapperProps {
    maps_api_key: string
    queryParams: QueryParams
}
const FunAppWrapperThingForHooksUsability = ({maps_api_key, queryParams} : FunWrapperProps) => {
    const [forecast] = useForecastMutation()
    const [getAqi] = useGetAqiMutation()
    const [orientationChanged, setOrientationChanged] = React.useState<boolean>(false)
    const [mobileOrientationChanged, setMobileOrientationChanged] = React.useState<boolean>(false)
    const screenOrientationType = (window.screen ? (window.screen.orientation ? window.screen.orientation.type : 'N/A') : 'N/A')
    const screenChangeListener = React.useCallback(
        (event : Event) => {
            // const type = event.target.type;
            // const angle = event.target.angle;
            // console.log(`ScreenOrientation change: ${type}, ${angle} degrees.`)
            setOrientationChanged(true)
            setMobileOrientationChanged(true)
        },
        [screenOrientationType]
    )

    if (window.screen.orientation) {
        window.screen.orientation.onchange = screenChangeListener
    }
    useSetPageTitle()
    useLoadRouteFromURL(queryParams, forecast, getAqi)
    useLoadControlPointsFromURL(queryParams)
    const isLandscape = useMediaQuery({query:'(orientation:landscape)'})
    const isLargeEnough = useMediaQuery({query:'(min-width: 950px)'})
    return (
        <div>
            {isLandscape && isLargeEnough && <Suspense fallback={<div>Loading Desktop UI...</div>}><LoadableDesktop mapsApiKey={maps_api_key} orientationChanged={orientationChanged} setOrientationChanged={setOrientationChanged}/></Suspense>}
            {(!isLargeEnough || !isLandscape) && <Suspense fallback={<div>Loading Mobile UI...</div>}><LoadableMobile mapsApiKey={maps_api_key} orientationChanged={mobileOrientationChanged} setOrientationChanged={setMobileOrientationChanged}/></Suspense>}
        </div>
    )
}
