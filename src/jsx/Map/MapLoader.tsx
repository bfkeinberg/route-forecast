import * as Sentry from "@sentry/react";
import lazyRetry from "@tdotcode/react-lazy-retry";
import {Suspense} from 'react';
import {connect, ConnectedProps} from 'react-redux';

import { routeLoadingModes } from '../../data/enums';
import ErrorBoundary from "../shared/ErrorBoundary";
import { RootState } from "jsx/app/topLevel";
import { useAppSelector } from "../../utils/hooks";

const addBreadcrumb = (msg : string) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}

const LoadableMap = lazyRetry(() => {addBreadcrumb('loading map');return import(/* webpackChunkName: "Map" */ './RouteForecastMap')}, 7, 1200);

type PropsFromRedux = ConnectedProps<typeof connector>

const MapLoader = (props : PropsFromRedux) => {
    // debug empty points and bounds
    const rwgpsRouteData = useAppSelector(state => state.routeInfo.rwgpsRouteData)
    const gpxRouteData = useAppSelector(state => state.routeInfo.gpxRouteData)
    let length = 0
    if (rwgpsRouteData && rwgpsRouteData[rwgpsRouteData.type] && rwgpsRouteData[rwgpsRouteData.type]['track_points']) {
        length = rwgpsRouteData[rwgpsRouteData.type]['track_points'].length
    } else if (gpxRouteData) {
        length = gpxRouteData.tracks[0].points.length
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

const mapStateToProps = (state : RootState) =>
    ({
        hasRouteData: (state.routeInfo.rwgpsRouteData || state.routeInfo.gpxRouteData || state.strava.activityStream),
        // TODO
        // this condition is not quite right -- it doesn't catch cases where we're in strava mode but no strava activity data has loaded
        // should change this and probably move it to a higher level component, when replacing the existing placeholder text with a splash screen or w/e
        hasMap: (state.forecast.forecast.length > 0 || state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA)
    });

const connector = connect(mapStateToProps)
export default connector(MapLoader);
