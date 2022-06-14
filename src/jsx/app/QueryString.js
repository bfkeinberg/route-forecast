import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setShortUrl, shortenUrl, setQueryString} from "../../redux/actions";
import queryString from 'query-string';
import { DateTime } from 'luxon';
import { formatControlsForUrl } from '../../utils/util';

// this function exists to let us preserve the user's specified start time and share the url for this route
// with someone in another time zone
// export is ony for the test method
export const dateToShortDate = function(date) {
    return Number.parseInt(date.toSeconds().toFixed(0));
};

// as above export is for benefit of test code
export const makeQuery = (routeNumber, pace,interval,metric,controls, strava_activity,
                          provider, showProvider) => {
    const query = {
        pace, interval, metric, rwgpsRoute: routeNumber, strava_activity, provider, showProvider
    }
    const formattedControls = formatControlsForUrl(controls, true)
    if (formattedControls !== "") {
        query.controlPoints = formattedControls
    }
    return query;
};

const QueryStringUpdater = ({routeNumber,start,pace,interval,metric,controls,setQueryString,setShortUrl,
                         shortenUrl,urlIsShortened,strava_activity,origin,href,provider,showProvider,hasForecast}) => {
    let url = origin;
    let query = null;
    if (routeNumber !== '') {
        const shortDate = dateToShortDate(start);
        query = makeQuery(routeNumber, pace, interval, metric, controls, strava_activity,
                          provider, showProvider);
        if (shortDate !== 'Invalid DateTime') {
            query.startTimestamp = shortDate;
            query.zone = start.zoneName;
        }
        url += `/?${queryString.stringify(query)}`;
        // don't shorten localhost with bitly
        if (/*origin !== 'http://localhost:8080' && */hasForecast && (url !== href || !urlIsShortened)) {
            shortenUrl(url);
        }
    }
    else {
        setShortUrl(' ');
    }
    setQueryString(url);
    return null;
};

QueryStringUpdater.propTypes = {
    routeNumber:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    strava_activity:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    start:PropTypes.instanceOf(DateTime).isRequired,
    pace:PropTypes.string.isRequired,
    interval:PropTypes.number.isRequired,
    metric:PropTypes.bool.isRequired,
    setQueryString:PropTypes.func.isRequired,
    shortenUrl:PropTypes.func.isRequired,
    setShortUrl:PropTypes.func.isRequired,
    controls:PropTypes.arrayOf(PropTypes.object).isRequired,
    urlIsShortened: PropTypes.bool.isRequired,
    origin: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    showProvider: PropTypes.bool.isRequired,
    hasForecast: PropTypes.bool.isRequired
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
        strava_activity: state.strava.activity,
        provider: state.forecast.weatherProvider,
        showProvider: state.controls.showWeatherProvider,
        hasForecast: state.forecast.forecast.length > 0
    });

const mapDispatchToProps = {
    setQueryString, shortenUrl, setShortUrl
};

export default connect(mapStateToProps,mapDispatchToProps)(QueryStringUpdater);

