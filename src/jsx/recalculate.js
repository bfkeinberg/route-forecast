import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {recalcRoute} from "./actions/actions";

const Recalculate = ({recalcRoute}) => {
    recalcRoute();
    return null;
};

Recalculate.propTypes = {
    start:PropTypes.instanceOf(Date).isRequired,
    pace:PropTypes.string.isRequired,
    interval:PropTypes.number.isRequired,
    recalcRoute:PropTypes.func.isRequired,
    metric:PropTypes.bool.isRequired,
    controls:PropTypes.arrayOf(PropTypes.object).isRequired
};

const mapStateToProps = (state) =>
    ({
        start: state.uiInfo.routeParams.start,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints
    });

const mapDispatchToProps = {
    recalcRoute
};

export default connect(mapStateToProps,mapDispatchToProps)(Recalculate);

