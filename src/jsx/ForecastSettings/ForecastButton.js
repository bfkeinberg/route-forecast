import { Button,Spinner } from '@blueprintjs/core';
import * as Sentry from "@sentry/react";
import PropTypes from 'prop-types';
import React from 'react';
import ReactGA from "react-ga4";
import {connect, useDispatch, useSelector} from 'react-redux';
import { useMediaQuery } from 'react-responsive';

import { shortenUrl } from "../../redux/actions";
import { useForecastMutation } from '../../redux/forecastApiSlice';
import { forecastAppended,forecastFetched, forecastFetchFailed, querySet } from '../../redux/reducer';
import { generateUrl } from '../../utils/queryStringUtils';
import { getForecastRequest } from '../../utils/util';
import { updateHistory } from "../app/updateHistory";
import { DesktopTooltip } from '../shared/DesktopTooltip';

const ForecastButton = ({fetchingForecast,submitDisabled, routeNumber, startTimestamp, pace, interval,
     metric, controls, strava_activity, strava_route, provider, showProvider, href, urlIsShortened, querySet, zone}) => {
        const dispatch = useDispatch()
        const [forecast, {isLoading}] = useForecastMutation()
        const type = useSelector(state => ((state.routeInfo.rwgpsRouteData !== null) ? "rwgps" : "gpx"))
        const routeName = useSelector(state => state.routeInfo.name)
        const routeData = useSelector(state => ((type === "rwgps") ? state.routeInfo.rwgpsRouteData : state.routeInfo.gpxRouteData))
        const userControlPoints = useSelector(state => state.controls.userControlPoints)
        const distanceInKm = useSelector(state => state.routeInfo.distanceInKm)

    const forecastByParts = (forecastRequest, zone, service, routeName, routeNumber) => {
        let requestCopy = Object.assign(forecastRequest)
        let forecastResults = []
        let locations = requestCopy.shift();
        let which = 0
        while (requestCopy.length > 0) {
            try {
                const request = {locations:locations, timezone:zone, service:service, routeName:routeName, routeNumber:routeNumber, which}
                const result = forecast(request).unwrap()
                forecastResults.push(result)
                locations = requestCopy.shift();
                ++which
            } catch (err) {
                dispatch(forecastFetchFailed(err))
            }
        }
        return Promise.all(forecastResults)
        // return forecastResults
    }
    const doForecastByParts = () => {
        const forecastRequest = getForecastRequest(routeData, startTimestamp, type, zone, pace, interval, userControlPoints)
        if (forecastRequest === undefined) {
            return { result: "error", error: "No route could be loaded" }
        }
        return forecastByParts(forecastRequest, zone, provider, routeName, routeNumber)
    }

    let tooltipContent = submitDisabled ?
        "Must provide an rwgps route id" :
        "Request a ride forecast";
    let buttonStyle = submitDisabled ? { pointerEvents: 'none', display: 'inline-flex' } : null;
    const forecastClick = async () => {
        await Sentry.startSpan({ name: "forecastClick" }, async () => {
            if (type === "rwgps") {
                ReactGA.event('add_to_cart', {
                    value: distanceInKm,
                    items: [{ item_id: routeNumber, item_name: routeName }]
                });
            } else {
                ReactGA.event('add_to_cart', {
                    value: distanceInKm,
                    items: [{ item_id: routeNumber, item_name: routeName }]
                });
            }
            try {
                const forecastResults = await doForecastByParts()
                forecastResults.sort((l,r) => l.forecast.distance-r.forecast.distance)
                const firstForecast = forecastResults.shift()
                dispatch(forecastFetched({ forecastInfo: {forecast: [firstForecast.forecast]}, timeZoneId: zone }))
                while (forecastResults.length > 0) {
                    // forecastResults.shift().then(nextForecast => {dispatch(forecastAppended(nextForecast.forecast))})
                    const nextForecast = forecastResults.shift().forecast
                    dispatch(forecastAppended(nextForecast))
                }
            } catch (err) {
                dispatch(forecastFetchFailed(err))
            }
        })
        const url = generateUrl(startTimestamp, routeNumber, pace, interval, metric, controls,
            strava_activity, strava_route, provider, showProvider, origin, true, dispatch, zone)
        querySet({queryString:url.url,searchString:url.search})
        updateHistory(url.url, true);
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
                >
                    {isLoading ? 'Creating forecast...' : 'Find Forecast'}
                    {(isLoading || fetchingForecast) && <Spinner />}
                </Button>
            </div>
        </DesktopTooltip>
    );
};

ForecastButton.propTypes = {
    fetchingForecast:PropTypes.bool.isRequired,
    submitDisabled:PropTypes.bool.isRequired,
    routeNumber: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    strava_activity: PropTypes.oneOfType([
        PropTypes.number,
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
    showProvider: PropTypes.bool.isRequired,
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
        showProvider: state.controls.showWeatherProvider
    });

const mapDispatchToProps = {
    querySet
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastButton);