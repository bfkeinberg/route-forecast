import { Button } from '@blueprintjs/core';
import * as Sentry from "@sentry/react";
import PropTypes from 'prop-types';
import React from 'react';
import ReactGA from "react-ga4";
import {connect, useDispatch, useSelector} from 'react-redux';
import { useMediaQuery } from 'react-responsive';

import { shortenUrl, msgFromError } from "../../redux/actions";
import { useForecastMutation, useGetAqiMutation } from '../../redux/forecastApiSlice';
import { forecastAppended,forecastFetchBegun,forecastFetched, forecastFetchFailed, querySet, errorMessageListSet } from '../../redux/reducer';
import { generateUrl } from '../../utils/queryStringUtils';
import { getForecastRequest } from '../../utils/util';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import { providerValues } from '../../redux/reducer';

const ForecastButton = ({fetchingForecast,submitDisabled, routeNumber, startTimestamp, pace, interval,
     metric, controls, strava_activity, strava_route, provider, href, urlIsShortened, querySet, zone}) => {
        const [forecast, forecastFetchResult] = useForecastMutation()
        const [getAQI, aqiFetchResult] = useGetAqiMutation()
        const dispatch = useDispatch()
        const type = useSelector(state => ((state.routeInfo.rwgpsRouteData !== null) ? "rwgps" : "gpx"))
        const routeName = useSelector(state => state.routeInfo.name)
        const routeData = useSelector(state => ((type === "rwgps") ? state.routeInfo.rwgpsRouteData : state.routeInfo.gpxRouteData))
        const userControlPoints = useSelector(state => state.controls.userControlPoints)
        const distanceInKm = useSelector(state => state.routeInfo.distanceInKm)
        const fetchAqi = useSelector(state => state.forecast.fetchAqi)
        const rusaRouteId = useSelector(state => state.uiInfo.routeParams.rusaPermRouteId)
        const segmentRange = useSelector(state => state.uiInfo.routeParams.segment)
        const { t } = useTranslation()

    const forecastByParts = (forecastRequest, zone, service, routeName, routeNumber) => {
        let requestCopy = Object.assign(forecastRequest)
        let forecastResults = []
        let aqiResults = []
        let locations = requestCopy.shift();
        let which = 0
        while (requestCopy.length >= 0 && locations) {
            const request = {locations:locations, timezone:zone, service:service, routeName:routeName, routeNumber:routeNumber, which}
            const result = forecast(request).unwrap()
            forecastResults.push(result)
            if (fetchAqi) {
                const aqiRequest = {locations:locations}
                const aqiResult = getAQI(aqiRequest).unwrap()
                aqiResults.push(aqiResult)
            }
            locations = requestCopy.shift();
            ++which
        }
        return [Promise.allSettled(forecastResults),fetchAqi?Promise.all(aqiResults):[]]
    }
    const doForecastByParts = (provider) => {
        const forecastRequest = getForecastRequest(routeData, startTimestamp, type, zone, 
            pace, interval, userControlPoints, segmentRange)
        if (!forecastRequest) {
            return { result: "error", error: "No route could be loaded" }
        }
        return forecastByParts(forecastRequest, zone, provider, routeName, routeNumber)
    }
    
    let tooltipContent = submitDisabled ?
        t('tooltips.forecast.disabled') :
        t('tooltips.forecast.enabled')
    let buttonStyle = submitDisabled ? { pointerEvents: 'none', display: 'inline-flex' } : null;
    
    const getForecastForProvider = async (provider) => {
        const forecastAndAqiResults = doForecastByParts(provider)
        const forecastResults = await forecastAndAqiResults[0]
        let filteredResults = forecastResults.filter(result => result.status === "fulfilled").map(result => result.value)
        filteredResults.sort((l,r) => l.forecast.distance-r.forecast.distance)
        let returnedForecast = [{...filteredResults.shift().forecast}]

        while (filteredResults.length > 0) {
            returnedForecast.push({...filteredResults.shift().forecast})
        }
        return returnedForecast
    }

    const grabAllPossibleForecasts = async () => {
        let allForecasts = {}
        await Promise.all(Object.keys(providerValues).map(async (provider) => allForecasts[provider] = await getForecastForProvider(provider)))
        // download the file
        const aElement = document.createElement('a');
        aElement.setAttribute('download', 'forecasts.json');
        const href = URL.createObjectURL(new Blob([JSON.stringify(allForecasts)]), {type:'application/json'})
        aElement.href = href;
        aElement.setAttribute('target', '_blank');
        aElement.click();
        URL.revokeObjectURL(href)
    }

    const forecastClick = async (event) => {
        if (event.altKey) {
            grabAllPossibleForecasts()
            return
        }
        await Sentry.startSpan({ name: "forecastClick" }, async () => {
            dispatch(forecastFetchBegun())
            const reactEventParams = {
                value: distanceInKm, currency:routeNumber, coupon:routeName,
                items: [{ item_id: '', item_name: '' }]
            }
            ReactGA.event('add_payment_info', reactEventParams);    
            const forecastAndAqiResults = doForecastByParts(provider)
            const forecastResults = await forecastAndAqiResults[0]
            if (forecastResults.length===0) {
                dispatch(forecastFetchFailed('No forecast was returned'))
                return
            }
            const aqiResults = await forecastAndAqiResults[1]
            let filteredResults = forecastResults.filter(result => result.status === "fulfilled").map(result => result.value)
            filteredResults.sort((l, r) => l.forecast.distance - r.forecast.distance)
            const firstForecastResult = filteredResults.shift()
            if (firstForecastResult) {
                const firstForecast = { ...firstForecastResult.forecast }
                if (aqiResults.length > 0) {
                    firstForecast.aqi = aqiResults.shift().aqi.aqi
                }
                dispatch(forecastFetched({ forecastInfo: { forecast: [firstForecast] }, timeZoneId: zone }))
                while (filteredResults.length > 0) {
                    const nextForecast = { ...filteredResults.shift().forecast }
                    if (aqiResults.length > 0) {
                        nextForecast.aqi = aqiResults.shift().aqi.aqi
                    }
                    dispatch(forecastAppended(nextForecast))
                }
            }
            // handle any errors
            dispatch(errorMessageListSet(forecastResults.filter(result => result.status === 'rejected').map(result => msgFromError(result))))
        })
        const url = generateUrl(startTimestamp, routeNumber, pace, interval, metric, controls,
            strava_activity, strava_route, provider, origin, true, dispatch, zone, rusaRouteId)
        querySet({url:url.url,search:url.search})
        Sentry.setContext("query", {queryString:url.search})
        // don't shorten localhost with bitly
        if (origin !== 'http://localhost:8080' && (url.url !== href || !urlIsShortened)) {
            dispatch(shortenUrl(url.url))
        }
    };

    const smallScreen = useMediaQuery({query: "(max-width: 800px)"})
    return (
        <DesktopTooltip content={tooltipContent}>
            <div id='forecast' style={{ 'display': 'flex', width: '100%', justifyContent: "center", margin: "10px 0px 0px 10px", flex: 1.6 }} cursor='not-allowed'>
            <Button
                    tabIndex='0'
                    intent="primary"
                    onClick={forecastClick}
                    style={{ ...buttonStyle, width: "100%", backgroundColor: "#137cbd", borderColor: "#137cbd", }}
                    disabled={submitDisabled || fetchingForecast}
                    small={smallScreen}
                    large={!smallScreen}
                    fill={true}
                    loading={forecastFetchResult.loading || aqiFetchResult.loading || fetchingForecast}
                >
                    {forecastFetchResult.isLoading ? t('buttons.forecastPending') : t("buttons.forecast")}
                </Button>
            </div>
        </DesktopTooltip>
    )
};

ForecastButton.propTypes = {
    fetchingForecast:PropTypes.bool.isRequired,
    submitDisabled:PropTypes.bool.isRequired,
    routeNumber: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    strava_activity: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([''])
    ]),
    strava_route: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([''])
    ]),
    startTimestamp: PropTypes.number.isRequired,
    zone: PropTypes.string.isRequired,
    pace: PropTypes.string.isRequired,
    interval: PropTypes.number.isRequired,
    metric: PropTypes.bool.isRequired,
    controls: PropTypes.arrayOf(PropTypes.object).isRequired,
    origin: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    urlIsShortened: PropTypes.bool.isRequired,
    href: PropTypes.string.isRequired,
    querySet: PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        // can't request a forecast without a route loaded
        submitDisabled: state.uiInfo.routeParams.rwgpsRoute === '' && state.routeInfo.gpxRouteData === null,
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

export default connect(mapStateToProps,mapDispatchToProps)(ForecastButton);