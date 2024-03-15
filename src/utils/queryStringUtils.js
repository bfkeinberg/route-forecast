import queryString from 'query-string';
import { formatControlsForUrl } from './util';
import { DateTime } from 'luxon';
import { updateUserControls } from "../redux/actions"
import { updateHistory } from "../jsx/app/updateHistory"

const maxUrlLength = 2048;
const maxControlNameLength = 15;

const shrinkControls = (controls, dispatch) => {
    const truncatedControls = controls.map(control => {
        return {
            name: control.name.replace(/control/i,'').slice(0, maxControlNameLength),
            distance: control.distance, duration: control.duration
        }
    });
    dispatch(updateUserControls(truncatedControls));
    return truncatedControls
}

const makeQuery = (routeNumber, pace, interval, metric, controls, strava_activity,
    strava_route, provider, showProvider) => {
    const query = {
        pace, interval, metric, rwgpsRoute: routeNumber, strava_activity, strava_route, provider, showProvider
    }
    const formattedControls = formatControlsForUrl(controls, true)
    if (formattedControls !== "") {
        query.controlPoints = formattedControls
    }
    return query;
};

// this function exists to let us preserve the user's specified start time and share the url for this route
// with someone in another time zone
const dateToShortDate = function (date) {
    return Number.parseInt(date.toSeconds().toFixed(0));
};

const buildUrl = (routeNumber, pace, interval, metric, controls, strava_activity,
    strava_route, provider, showProvider, shortDate, start, origin, setPageUrl, zone) => {
    let query = makeQuery(routeNumber, pace, interval, metric, controls, strava_activity,
        strava_route, provider, showProvider);
    if (shortDate !== 'Invalid DateTime') {
        query.startTimestamp = shortDate;
        query.zone = zone ? zone : start.zoneName;
    }
    const search = queryString.stringify(query)
    const url = `${origin}/?${search}`
    if (setPageUrl) {
        updateHistory(url, search)
    }
    return {url,search}
}

export const generateUrl = (startTimestamp, routeNumber, pace, interval, metric, controls, strava_activity,
    strava_route, provider, showProvider, origin, setPageUrl, dispatch, zone) => {
    const start = DateTime.fromMillis(startTimestamp, {zone:zone})
    const shortDate = dateToShortDate(start);
    let url = buildUrl(routeNumber, pace, interval, metric, controls, strava_activity, strava_route, provider, showProvider, shortDate, start, origin, setPageUrl, zone)
    if (url.url.length >= maxUrlLength) {
        const truncatedControls = shrinkControls(controls, dispatch);
        url = buildUrl(routeNumber, pace, interval, metric, truncatedControls, strava_activity, provider, showProvider, shortDate, start, origin, setPageUrl, zone)
    }
    return url;
}