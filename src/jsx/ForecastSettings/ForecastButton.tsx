import { Button } from '@blueprintjs/core';
import * as Sentry from "@sentry/react";
import React, {useRef, useState} from 'react';
import ReactGA from "react-ga4";
import {connect, ConnectedProps} from 'react-redux';
import { useMediaQuery } from 'react-responsive';

import { msgFromError, removeDuplicateForecasts, extractRejectedResults } from '../../redux/forecastActions';
import { shortenUrl } from '../../redux/actions';
import { useForecastMutation, useGetAqiMutation } from '../../redux/forecastApiSlice';
import { forecastFetched, forecastAppended, Forecast } from '../../redux/forecastSlice';
import { querySet } from '../../redux/paramsSlice';
import { errorMessageListSet, errorMessageListAppend, forecastFetchBegun, forecastFetchFailed } from '../../redux/dialogParamsSlice';
import { generateUrl } from '../../utils/queryStringUtils';
import { getForecastRequest } from '../../utils/util';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import { providerValues } from '../../redux/providerValues';
import { useForecastRequestData, useGetForecastRequestDependencies } from '../../utils/hooks';
import type { RootState } from "../../redux/store";
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
import type {ForecastRequest} from '../../utils/gpxParser'
import { GpxRouteData, RwgpsRoute, RwgpsTrip } from 'redux/routeInfoSlice';
import { writeObjToFile } from '../../utils/writeToFile';
import { i18n } from 'i18next';
declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        // extends React's HTMLAttributes
        cursor?:string
    }
}

type PropsFromRedux = ConnectedProps<typeof connector>
type ForecastButtonProps = PropsFromRedux & {
    href: string
    origin: string
    computeStdDev: boolean
    downloadAll: boolean
}
const ForecastButton = ({fetchingForecast,submitDisabled, routeNumber, startTimestamp, pace, interval,
     metric, controls, strava_activity, strava_route, provider, href, 
     urlIsShortened, querySet, zone, computeStdDev, downloadAll} : ForecastButtonProps) => {
    const [forecast, forecastFetchResult] = useForecastMutation()
    const [getAQI, aqiFetchResult] = useGetAqiMutation()
    const dispatch = useAppDispatch()
    const {
        routeData,
        timeZoneId,
        controlPoints,
        segment,
        routeUUID,
    } = useGetForecastRequestDependencies()    
    const rwgpsRouteData = useAppSelector(state => state.routeInfo.rwgpsRouteData)
    const gpxRouteData = useAppSelector(state => state.routeInfo.gpxRouteData)
    const routeName = useAppSelector(state => state.routeInfo.name)
    const userControlPoints = useAppSelector(state => state.controls.userControlPoints)
    const distanceInKm = useAppSelector(state => state.routeInfo.distanceInKm)
    const fetchAqi = useAppSelector(state => state.forecast.fetchAqi)
    const rusaRouteId = useAppSelector(state => state.uiInfo.routeParams.rusaPermRouteId)
    const segmentRange = useAppSelector(state => state.uiInfo.routeParams.segment)
    const { t } = useTranslation()
    const forecastRequestData = useRef(useForecastRequestData())
    const [optionPressed, setOptionPressed] = useState(false)
    const [shiftPressed, setShiftPressed] = useState(false)
    const { i18n } = useTranslation()

    const keyIsDown = (event : KeyboardEvent) => {
        if (event.code === "AltLeft" || event.code === "AltRight") {
            setOptionPressed(true)
        }
        if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
            setShiftPressed(true)
        }
    }

    const keyIsUp = (event : KeyboardEvent) => {
        if (event.code === "AltLeft" || event.code === "AltRight") {
            setOptionPressed(false)
        }
        if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
            setShiftPressed(false)
        }
    }

    React.useEffect(() => {
        window.addEventListener('keydown', keyIsDown);
        window.addEventListener('keyup', keyIsUp);
        
/*         return () => {
            window.removeEventListener('keydown', keyIsDown);
            window.removeEventListener('keyup', keyIsUp);
        }
 */    }, [optionPressed, shiftPressed])

    const forecastByParts = (forecastRequest : Array<ForecastRequest>, zone : string, service : string, routeName : string, routeNumber : string) => {
        let requestCopy = Object.assign(forecastRequest)
        let forecastResults = []
        let aqiResults = []
        let locations = requestCopy.shift();
        let which = 0
        while (requestCopy.length >= 0 && locations) {
            const request = {locations:locations, timezone:zone, service:service, routeName:routeName,
                 routeNumber:routeNumber, lang: i18n.language, which}
            const result = forecast(request).unwrap()
            result.catch(() => { /* Handled by Promise.allSettled */ });
            forecastResults.push(result)
            if (fetchAqi) {
                const aqiRequest = {locations:locations}
                const aqiResult = getAQI(aqiRequest).unwrap()
                aqiResult.catch(() => { /* Handled by Promise.allSettled */ });
                aqiResults.push(aqiResult)
            }
            locations = requestCopy.shift();
            ++which
        }
        return [Promise.allSettled(forecastResults),fetchAqi?Promise.allSettled(aqiResults):[]]    
    }

    const doForecastByParts = (provider : string, routeData :RwgpsRoute|RwgpsTrip|GpxRouteData) => {
        const forecastRequest = getForecastRequest(routeData, startTimestamp, zone, 
            pace, interval, userControlPoints, segmentRange, routeUUID)
        return forecastByParts(forecastRequest, zone, provider, routeName, routeNumber)
    }
    
    let tooltipContent = submitDisabled ?
        t('tooltips.forecast.disabled') :
        t('tooltips.forecast.enabled')
    let buttonStyle = submitDisabled ? { pointerEvents: 'none' as const, display: 'inline-flex' } : null;
    
    const getForecastForProvider = async (provider : string) => {
        if (!rwgpsRouteData && !gpxRouteData) {
            // only call when there is data
            return []
        }
        const routeData = rwgpsRouteData && rwgpsRouteData || gpxRouteData
        const forecastAndAqiResults = doForecastByParts(provider, routeData)
        const forecastResults = await forecastAndAqiResults[0]
        let filteredResults = forecastResults.filter(result => result.status === "fulfilled").map(result => (result as PromiseFulfilledResult<{forecast:Forecast}>).value)
        filteredResults.sort((l,r) => l.forecast.distance-r.forecast.distance)
        filteredResults = removeDuplicateForecasts(filteredResults)
        const firstForecastResult = filteredResults.shift()
        if (firstForecastResult) {
            const firstForecast = { ...firstForecastResult.forecast }
            let returnedForecast = [firstForecast]
            while (filteredResults.length > 0) {
                returnedForecast.push({ ...filteredResults.shift()!.forecast })
            }
            return returnedForecast
        }
        return []
    }

    interface ForecastData {
        length: number
        daysInFuture: number
    }

    interface AllForecasts {
        [index:string]:Forecast[]
    }

    const grabAllPossibleForecasts = async (forecastData : ForecastData) => {
        let allForecasts = {} as AllForecasts
        await Promise.all(Object.entries(providerValues).
                        filter(entry => entry[1].maxCallsPerHour === undefined || 
                            entry[1].maxCallsPerHour > forecastData.length).
                        filter(entry => entry[1].max_days >= forecastData.daysInFuture).
                        map(async (provider) => allForecasts[provider[0]] = await getForecastForProvider(provider[0])))
        // download the file
        writeObjToFile(allForecasts, true)
    }

    const getValidProviders = (forecastData: ForecastData, provider: string) =>
    {
        ReactGA.event('level_end', {level_name:'USD', success: true})
        const providerList = Object.entries(providerValues).
            filter(entry => entry[1].maxCallsPerHour === undefined ||
                entry[1].maxCallsPerHour > forecastData.length).
            filter(entry => entry[1].max_days >= forecastData.daysInFuture).
            map(value => value[0]);
        // put the primary forecast provider at the front
        const index = providerList.indexOf(provider);
        providerList.splice(index, 1);
        providerList.unshift(provider);
        return providerList.join(",")
    }

    const forecastClick = async (event : React.MouseEvent) => {
        if (downloadAll || (event.altKey && !event.shiftKey)) {
            ReactGA.event('generate_lead', {currency:'USD', value: distanceInKm})
            grabAllPossibleForecasts(forecastRequestData.current)
            return
        }
        let forecastProvider = (computeStdDev || (event.altKey && event.shiftKey)) ? getValidProviders(forecastRequestData.current, provider) : provider
        // await Sentry.startSpan({ name: "forecastClick" }, async () => {
            dispatch(forecastFetchBegun())
            const reactEventParams = {
                value: distanceInKm, currency:routeNumber, coupon:routeName,
                items: [{ item_id: '', item_name: '' }]
            }
            ReactGA.event('add_payment_info', reactEventParams);
            const routeData = rwgpsRouteData && rwgpsRouteData || gpxRouteData
            // below makes Typescript happy but should not be neccessary given that the button ought to be
            // disabled via submitDisabled in this case
            if (!routeData) {return}
            const forecastAndAqiResults = doForecastByParts(forecastProvider, routeData)
            const forecastResults = await forecastAndAqiResults[0]
            if (forecastResults.length===0) {
                dispatch(forecastFetchFailed('No forecast was returned'))
                return
            }
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
                dispatch(forecastFetched({ forecastInfo: { forecast: [firstForecast] }, timeZoneId: zone }))
                while (filteredResults.length > 0) {
                    const nextForecast = { ...filteredResults.shift()!.forecast }
                    if (filteredAqi.length > 0) {
                        nextForecast.aqi = filteredAqi.shift()!.aqi.aqi
                    }
                    dispatch(forecastAppended(nextForecast))
                }
            }
            
            // handle any errors
            dispatch(errorMessageListSet(extractRejectedResults(forecastResults).map(result => msgFromError(result))))
            dispatch(errorMessageListAppend(extractRejectedResults(aqiResults).map(result => msgFromError(result))))
        // })
        const url = generateUrl(startTimestamp, routeNumber, pace, interval, metric, controls,
            strava_activity, strava_route, provider, origin, true, zone, rusaRouteId)
        querySet({url:url.url,search:url.search})
        Sentry.setContext("query", {queryString:url.search})
        // don't shorten localhost with bitly
        if (origin !== 'http://localhost:8080' && (url.url !== href || !urlIsShortened)) {
            dispatch(shortenUrl(url.url))
        }
    };

    const smallScreen = useMediaQuery({query: "(max-width: 800px)"})
    forecastRequestData.current = useForecastRequestData()

    const buttonText = (computeStdDev || (optionPressed && shiftPressed)) ? t("buttons.standardDeviation") : 
        ((optionPressed || downloadAll) ? t("buttons.downloadAll") : t("buttons.forecast"))
    return (
        <DesktopTooltip content={tooltipContent}>
            <div id='forecast' style={{ 'display': 'flex', width: '100%', justifyContent: "center", margin: "10px 0px 0px 10px", flex: 1.6 }} cursor='not-allowed'>
                <Button
                    tabIndex={0}
                    intent="primary"
                    onClick={forecastClick}
                    onKeyDown={keyIsDown as unknown as (ev:React.KeyboardEvent)=>void}
                    onKeyUp={keyIsUp as unknown as (ev:React.KeyboardEvent)=>void}
                    style={{ ...buttonStyle, width: "100%", backgroundColor: "#137cbd", borderColor: "#137cbd", }}
                    disabled={submitDisabled || fetchingForecast}
                    size={smallScreen?'small':'large'}
                    fill={true}
                    loading={forecastFetchResult.isLoading || aqiFetchResult.isLoading || fetchingForecast}
                >
                    {forecastFetchResult.isLoading ? t('buttons.forecastPending') : buttonText}
                </Button>
            </div>
        </DesktopTooltip>
    )
}

const mapStateToProps = (state : RootState) =>
    ({
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        // can't request a forecast without a route loaded
        submitDisabled: !state.routeInfo.rwgpsRouteData && !state.routeInfo.gpxRouteData,
        queryString: state.params.queryString,
        routeNumber: state.uiInfo.routeParams.rwgpsRoute !== '' ? state.uiInfo.routeParams.rwgpsRoute : state.strava.route,
        startTimestamp: state.uiInfo.routeParams.startTimestamp,
        zone: state.uiInfo.routeParams.zone,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints,
        urlIsShortened: state.uiInfo.dialogParams.shortUrl !== ' ',
        strava_activity: state.strava.activity,
        strava_route: state.strava.route,
        provider: state.forecast.weatherProvider,
    });

const mapDispatchToProps = {
    querySet
};

export     interface AllForecasts {
    [index:string]:Forecast[]
}

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(ForecastButton);