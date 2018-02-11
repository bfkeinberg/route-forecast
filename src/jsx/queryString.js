import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setShortUrl, shortenUrl} from "./actions/actions";
import moment from 'moment';

const queryString = require('query-string');

const formatOneControl = function(controlPoint) {
    if (typeof controlPoint === 'string') {
        return controlPoint;
    }
    return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
};

const formatControlsForUrl = function(controlPoints) {
    return controlPoints.filter(point => point.name !== '').reduce((queryParam,point) => {
        return `${formatOneControl(queryParam)}:${formatOneControl(point)}`},'');
};

// this function exists to let us preserve the user's specified start time and share the url for this route
// with someone in another time zone
const dateToShortDate = function(date) {
    return moment(date).format("ddd MMM D YYYY HH:mm:ss");
};

const QueryString = ({routeNumber,start,pace,interval,metric,controls,/*setQueryString,*/shortenUrl,shortUrl}) => {
    let url = location.origin;
    if (routeNumber !== '') {
        let query = {start:dateToShortDate(start),pace:pace,interval:interval,metric:metric,
            rwgpsRoute:routeNumber,controlPoints:formatControlsForUrl(controls)};
        url += `/?${queryString.stringify(query)}`;
        if (url !== location.href || shortUrl === ' ') {
            shortenUrl(url);
        }
    }
    else {
        setShortUrl('');
    }
    history.pushState(null, 'nothing', url);
    // setQueryString(url);
    return null;
};

QueryString.propTypes = {
    routeNumber:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    start:PropTypes.instanceOf(Date).isRequired,
    pace:PropTypes.string.isRequired,
    interval:PropTypes.number.isRequired,
    // setQueryString:PropTypes.func.isRequired,
    shortenUrl:PropTypes.func.isRequired,
    setShortUrl:PropTypes.func.isRequired,
    controls:PropTypes.arrayOf(PropTypes.object).isRequired,
    shortUrl: PropTypes.string
};

const mapStateToProps = (state) =>
    ({
        routeNumber: state.uiInfo.routeParams.rwgpsRoute,
        start: state.uiInfo.routeParams.start,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints,
        shortUrl: state.uiInfo.dialogParams.shortUrl
    });

const mapDispatchToProps = {
    /*setQueryString, */shortenUrl, setShortUrl
};

export default connect(mapStateToProps,mapDispatchToProps)(QueryString);

