import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {recalcRoute} from "./actions/actions";
import { DateTime } from 'luxon';

export const Recalculate = ({rwgpsRoute,gpxRouteData,start,recalcRoute}) => {
    if (rwgpsRoute === '' && gpxRouteData===null) {
        return null;
    }
    if (start === null) {
        return null;
    }
    recalcRoute();
    return null;
};

Recalculate.propTypes = {
    start:PropTypes.instanceOf(DateTime),
    pace:PropTypes.string.isRequired,
    interval:PropTypes.number.isRequired,
    recalcRoute:PropTypes.func.isRequired,
    metric:PropTypes.bool.isRequired,
    gpxRouteData:PropTypes.object,
    rwgpsRoute:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    controls:PropTypes.arrayOf(PropTypes.object).isRequired
};

const mapStateToProps = (state) =>
    ({
        start: state.uiInfo.routeParams.start,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints,
        rwgpsRoute:state.uiInfo.routeParams.rwgpsRoute,
        gpxRouteData:state.routeInfo.gpxRouteData
    });

const mapDispatchToProps = {
    recalcRoute
};

export default connect(mapStateToProps,mapDispatchToProps)(Recalculate);

