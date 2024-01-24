import React from 'react';
import PropTypes from 'prop-types';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {connect, useDispatch} from 'react-redux';
import {requestForecast, shortenUrl} from "../../redux/actions";
import { useMediaQuery } from 'react-responsive';
import { Spinner, Button } from '@blueprintjs/core';
import { updateHistory } from "../app/updateHistory";
import { generateUrl } from '../../utils/queryStringUtils';
import { querySet } from '../../redux/reducer';

const ForecastButton = ({fetchingForecast,requestForecast,routeInfo,submitDisabled, routeNumber, startTimestamp, pace, interval,
     metric, controls, strava_activity, provider, showProvider, href, urlIsShortened, querySet}) => {
    const dispatch = useDispatch()
    let tooltipContent = submitDisabled ?
        "Must provide an rwgps route id" :
        "Request a ride forecast";
    let buttonStyle = submitDisabled ? { pointerEvents: 'none', display: 'inline-flex' } : null;
    const forecastClick = () => {
        requestForecast(routeInfo);
        const url = generateUrl(startTimestamp, routeNumber, pace, interval, metric, controls, strava_activity, provider, showProvider, origin, true)
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
                    {fetchingForecast ? 'Creating forecast...' : 'Find Forecast'}
                    {fetchingForecast && <Spinner />}
                </Button>
            </div>
        </DesktopTooltip>
    );
};

ForecastButton.propTypes = {
    requestForecast:PropTypes.func.isRequired,
    fetchingForecast:PropTypes.bool.isRequired,
    submitDisabled:PropTypes.bool.isRequired,
    routeInfo:PropTypes.object.isRequired,
    routeNumber: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    strava_activity: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    startTimestamp: PropTypes.number.isRequired,
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
        routeInfo: state.routeInfo,
        queryString: state.params.queryString,
        routeNumber: state.uiInfo.routeParams.rwgpsRoute,
        startTimestamp: state.uiInfo.routeParams.startTimestamp,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints,
        urlIsShortened: state.uiInfo.dialogParams.shortUrl !== ' ',
        strava_activity: state.strava.activity,
        provider: state.forecast.weatherProvider,
        showProvider: state.controls.showWeatherProvider
    });

const mapDispatchToProps = {
    requestForecast, querySet
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastButton);