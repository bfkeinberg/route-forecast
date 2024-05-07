import * as Sentry from "@sentry/react";
import lazyRetry from "@tdotcode/react-lazy-retry";
import PropTypes from 'prop-types';
import React, {Suspense} from 'react';
import {connect, useSelector} from 'react-redux';

import { routeLoadingModes } from '../../data/enums';
import ErrorBoundary from "../shared/ErrorBoundary";

const addBreadcrumb = (msg) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}

const LoadableMap = lazyRetry(() => {addBreadcrumb('loading map');return import(/* webpackChunkName: "Map" */ './RouteForecastMap')}, 7, 1200);

const MapLoader = (props) => {
    // debug empty points and bounds
    const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
    let length = 0
    if (rwgpsRouteData && rwgpsRouteData[rwgpsRouteData.type] && rwgpsRouteData[rwgpsRouteData.type]['track_points']) {
        length = rwgpsRouteData[rwgpsRouteData.type]['track_points'].length
    }
    if (props.hasMap && props.hasRouteData) {
        Sentry.addBreadcrumb({
            category: 'load',
            level: 'info',
            message:`Loading map with ${length} route points`
        })
        return <ErrorBoundary>
            <Suspense fallback={<div>Loading Map...</div>}>
                <LoadableMap {...props} />
            </Suspense>
        </ErrorBoundary>;
    } else {
        return <div>Map for forecast</div>
    }
};

const mapStateToProps = (state) =>
    ({
        // TODO
        // this condition is not quite right -- it doesn't catch cases where we're in strava mode but no strava activity data has loaded
        // should change this and probably move it to a higher level component, when replacing the existing placeholder text with a splash screen or w/e
        hasRouteData: (state.routeInfo.rwgpsRouteData || state.routeInfo.gpxRouteData || state.strava.activityStream),
        hasMap: (state.forecast.forecast.length > 0 || state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA)
    });

// eslint-disable-next-line new-cap
export default connect(mapStateToProps)(MapLoader);
