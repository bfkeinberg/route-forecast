import React, {Suspense} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import { routeLoadingModes } from '../../data/enums';
import ErrorBoundary from "../shared/ErrorBoundary";

const LoadableMap = React.lazy(() => import(/* webpackChunkName: "Map" */ './RouteForecastMap'));

const MapLoader = (props) => {
    if (props.hasMap) {
        return <ErrorBoundary>
            <Suspense fallback={<div>Loading Map...</div>}>
                <LoadableMap {...props} />
            </Suspense>
        </ErrorBoundary>;
    } else {
        return <div>Map for forecast</div>
    }
};

MapLoader.propTypes = {
    hasMap:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        // TODO
        // this condition is not quite right -- it doesn't catch cases where we're in strava mode but no strava activity data has loaded
        // should change this and probably move it to a higher level component, when replacing the existing placeholder text with a splash screen or w/e
        hasMap: (state.forecast.forecast.length > 0 || state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA)
    });

// eslint-disable-next-line new-cap
export default connect(mapStateToProps)(MapLoader);
