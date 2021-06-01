import React, {Suspense} from 'react';
import {lazy} from '@loadable/component';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

const LoadableMap = lazy(() => import(/* webpackChunkName: "Map" */ './map'));

const MapLoader = (props) => {
    if (props.hasMap) {
         return <Suspense fallback={<div>Loading Map...</div>}>
            <LoadableMap {...props}/>
         </Suspense>
     } else {
        return <div>Map for forecast</div>
    }
};

MapLoader.propTypes = {
    hasMap:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        hasMap: (state.forecast.forecast.length > 0 || state.controls.stravaAnalysis) && state.routeInfo.bounds !== null
    });

// eslint-disable-next-line new-cap
export default connect(mapStateToProps)(MapLoader);
