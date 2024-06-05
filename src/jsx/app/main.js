import "normalize.css/normalize.css";
import '@blueprintjs/core/lib/css/blueprint.css';
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import 'Images/style.css';

import * as Sentry from "@sentry/react";
import {Info} from "luxon";
import PropTypes from 'prop-types';
import queryString from 'query-string';
import React, {lazy, Suspense,useEffect} from 'react';
import cookie from 'react-cookies';
import { useDispatch, useSelector } from 'react-redux';
import  {useMediaQuery} from 'react-responsive';

import {
    actionUrlAdded, apiKeysSet, displayControlTableUiSet, fetchAqiSet, metricSet, providerValues, queryCleared, querySet,
     reset, routeLoadingModeSet, rusaPermRouteIdSet,
    rwgpsRouteSet, rwgpsTokenSet,
    startTimestampSet,
    stopAfterLoadSet, stravaActivitySet, stravaErrorSet, stravaRefreshTokenSet,
    stravaRouteSet, stravaTokenSet, usePinnedRoutesSet, zoomToRangeSet, defaultProvider
} from "../../redux/reducer";

const addBreadcrumb = (msg) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}
const LoadableDesktop = lazy(() => {addBreadcrumb('loading desktop UI'); return import( /* webpackChunkName: "DesktopUI" */'../DesktopUI').catch((error) => {
    setTimeout(() => window.location.reload(), 5000);
    return { default: () => <div>{`Error ${error} loading the component. Window will reload in five seconds`}</div> };
})})
const LoadableMobile = lazy(() => {addBreadcrumb('loading mobile UI'); return import( /* webpackChunkName: "MobileUI" */'../MobileUI').catch((error) => {
    setTimeout(() => window.location.reload(), 5000);
    return { default: () => <div>{`Error ${error} loading the component. Window will reload in five seconds`}</div> };
})})

import { routeLoadingModes } from '../../data/enums';
import {
    loadCookie,
    loadRouteFromURL,
    saveCookie,
    setInterval,
    setPace,
    setWeatherProvider,
    updateUserControls,
} from "../../redux/actions";
import { useForecastMutation, useGetAqiMutation } from '../../redux/forecastApiSlice';
import { inputPaceToSpeed,parseControls } from '../../utils/util';

const checkCredentialsInterface = () => {
    return typeof PasswordCredential !== 'undefined' && typeof PublicKeyCredential !== 'undefined' && 
        "credentials" in navigator && "store" in navigator.credentials && "get" in navigator.credentials &&
        "password" in PasswordCredential && "name" in PasswordCredential
}

export const saveRwgpsCredentials = (token) => {
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

const loadAndStoreRwgpsCredentialsViaCookie = (dispatch) => {
    const token = loadCookie("rwgpsToken");
    if (token) {
        dispatch(rwgpsTokenSet(token))
        saveRwgpsCredentials(token);
    }
}

const setupRideWithGps = async (dispatch) => {
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
                dispatch(rwgpsTokenSet(credentials.password))
                saveRwgpsCredentials(credentials.password);
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

const setupBrowserForwardBack = (dispatch, origin, forecastFunc, aqiFunc) => {
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
                // reload previous or next route when moving throw browser history with forward or back buttons
                let queryParams = queryString.parse(event.state);
                dispatch(querySet({url:`${origin}/?${event.state}`,search:event.state}))
                updateFromQueryParams(dispatch, queryParams);
                if (queryParams.rwgpsRoute !== undefined || queryParams.strava_route) {
                    dispatch(loadRouteFromURL(forecastFunc, aqiFunc))
                }
            }
        }
    }    
}

const getStravaToken = (queryParams, dispatch) => {
    if (queryParams.strava_access_token !== undefined) {
        saveCookie('strava_access_token', queryParams.strava_access_token);
        saveCookie('strava_refresh_token', queryParams.strava_refresh_token);
        saveCookie('strava_token_expires_at', queryParams.strava_token_expires_at);
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

const hasProvider = (provider) => {
    return provider && Object.keys(providerValues).includes(provider)
}

const hasZone = (zone) => {
    return zone && Info.isValidIANAZone(zone);
}

const updateFromQueryParams = (dispatch, queryParams) => {
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
            dispatch(startTimestampSet({ start: queryParams.startTimestamp, zone: queryParams.zone }))
        } else {
            dispatch(startTimestampSet({ start: queryParams.startTimestamp }))
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
    dispatch(metricSet(queryParams.metric === "true"))
    dispatch(stravaActivitySet(queryParams.strava_activity))
    dispatch(stravaRouteSet(queryParams.strava_route))
    dispatch(stravaErrorSet(queryParams.strava_error))
    if (queryParams.strava_analysis !== undefined) {
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

const RouteWeatherUI = ({search, href, action, maps_api_key, timezone_api_key, bitly_token, origin}) => {
    const dispatch = useDispatch()
    const [forecast] = useForecastMutation()
    const [getAqi] = useGetAqiMutation()

    let queryParams = queryString.parse(search);
    dispatch(querySet({url:href,search:search}))
    Sentry.setContext("query", {queryString:search})
    updateFromQueryParams(dispatch, queryParams);
    dispatch(actionUrlAdded(action))
    dispatch(apiKeysSet({maps_api_key:maps_api_key,timezone_api_key:timezone_api_key, bitly_token:bitly_token}))
    setupRideWithGps(dispatch);
    setupBrowserForwardBack(dispatch, origin, forecast, getAqi)
    dispatch(updateUserControls(queryParams.controlPoints?[]:parseControls(queryParams.controlPoints,true)))
    const zoomToRange = loadCookie('zoomToRange');
    if (zoomToRange !== undefined) {
        dispatch(zoomToRangeSet(zoomToRange==="true"))
    }
    const fetchAqi = loadCookie('fetchAqi');
    if (fetchAqi) {
        dispatch(fetchAqiSet(fetchAqi==="true"))
    }

    return (
        <FunAppWrapperThingForHooksUsability maps_api_key={maps_api_key} queryParams={queryString.parse(search)}/>
    )

}

export default React.memo(RouteWeatherUI)

const useLoadRouteFromURL = (queryParams, forecastFunc, aqiFunc) => {
    const dispatch = useDispatch()
    useEffect(() => {
        if (queryParams.rwgpsRoute || queryParams.strava_route) {
            dispatch(loadRouteFromURL(forecastFunc, aqiFunc))
        }
    }, [queryParams])
}

const useLoadControlPointsFromURL = (queryParams) => {

    const dispatch = useDispatch()
    useEffect(() => {
        if (queryParams.controlPoints === undefined || queryParams.controlPoints === "") {
            dispatch(updateUserControls([]))
        } else {
            dispatch(updateUserControls(parseControls(queryParams.controlPoints, false)))
            dispatch(displayControlTableUiSet(true))
        }
    }, [queryParams])
}

const useSetPageTitle = () => {

    const routeInfo = useSelector(state => state.routeInfo)

    useEffect(() => {
        if (routeInfo.name !== '') {
            document.title = `Forecast for ${routeInfo.name}`;
        }
    }, [routeInfo.name])
}

const FunAppWrapperThingForHooksUsability = ({maps_api_key, queryParams}) => {
    const [forecast] = useForecastMutation()
    const [getAqi] = useGetAqiMutation()
    useSetPageTitle()
    useLoadRouteFromURL(queryParams, forecast, getAqi)
    useLoadControlPointsFromURL(queryParams)
    const isLandscape = useMediaQuery({query:'(orientation:landscape)'})
    const isLargeEnough = useMediaQuery({query:'(min-width: 850px)'})
    return (
        <div>
            {isLandscape && isLargeEnough && <Suspense fallback={<div>Loading Desktop UI...</div>}><LoadableDesktop mapsApiKey={maps_api_key} /></Suspense>}
            {(!isLargeEnough || !isLandscape) && <Suspense fallback={<div>Loading Mobile UI...</div>}><LoadableMobile mapsApiKey={maps_api_key} /></Suspense>}
        </div>
    )
}

FunAppWrapperThingForHooksUsability.propTypes = {
        maps_api_key: PropTypes.string.isRequired,
        queryParams: PropTypes.object.isRequired
};
