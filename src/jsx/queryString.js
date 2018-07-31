import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setShortUrl, shortenUrl} from "./actions/actions";
import moment from 'moment';

import queryString from 'query-string';

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
export const dateToShortDate = function(date) {
    return moment(date).format("ddd MMM D YYYY HH:mm:ss");
};

export const makeQuery = (routeNumber, pace,interval,metric,controls, strava_activity) => {
    return {pace:pace,interval:interval,metric:metric,
        rwgpsRoute:routeNumber,controlPoints:formatControlsForUrl(controls),
        strava_activity:strava_activity};
};

const QueryStringUpdater = ({routeNumber,start,pace,interval,metric,controls,/*setQueryString,*/
                         shortenUrl,urlIsShortened,strava_activity}) => {
    let url = location.origin;
    let query = null;
    if (routeNumber !== '') {
        const shortDate = dateToShortDate(start);
        query = makeQuery(routeNumber, pace, interval, metric, controls, strava_activity);
        if (shortDate !== 'Invalid date') {
            query.start = shortDate;
        }
        url += `/?${queryString.stringify(query)}`;
        if (url !== location.href || !urlIsShortened) {
            shortenUrl(url);
        }
    }
    else {
        setShortUrl('');
    }
    if (!(/HeadlessChrome/).test(window.navigator.userAgent) && query !== null) {
        let oldState = history.state;
        if (oldState !== null && oldState.rwgpsRoute === query.rwgpsRoute) {
            history.replaceState(query, 'nothing', url);
        } else {
            history.pushState(query, 'nothing', url);
        }
    }
    // setQueryString(url);
    return null;
};

QueryStringUpdater.propTypes = {
    routeNumber:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    strava_activity:PropTypes.oneOfType([
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
    urlIsShortened: PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        routeNumber: state.uiInfo.routeParams.rwgpsRoute,
        start: state.uiInfo.routeParams.start,
        pace: state.uiInfo.routeParams.pace,
        interval: state.uiInfo.routeParams.interval,
        metric: state.controls.metric,
        controls: state.controls.userControlPoints,
        urlIsShortened: state.uiInfo.dialogParams.shortUrl !== ' ',
        strava_activity: state.strava.activity
    });

const mapDispatchToProps = {
    /*setQueryString, */shortenUrl, setShortUrl
};

export default connect(mapStateToProps,mapDispatchToProps)(QueryStringUpdater);

