import { DateTime } from 'luxon';
import queryString from 'query-string';

import { updateHistory } from "../jsx/app/updateHistory"
import { formatControlsForUrl } from './util';
import { UserControl } from '../redux/controlsSlice';

const maxUrlLength = 2048;
const maxControlNameLength = 10;

const shrinkControls = (controls : Array<UserControl>) => {
    const truncatedControls = controls.map(control => {
        return {
            name: control.name.replace(/control/i,'').replace(',','_').slice(0, maxControlNameLength),
            distance: control.distance, duration: control.duration
        }
    });
    return truncatedControls
}

interface Query {
    pace : string
    interval : number
    metric : boolean
    strava_activity : string,
    strava_route : string
    provider : string
    rusa_route_id : string
    rwgpsRoute: string
    controlPoints? : string
    zone? : string | null
    startTimestamp? : number
}

const makeQuery = (routeNumber : string, pace : string, interval : number, metric : boolean, 
    controls : Array<UserControl>, strava_activity : string,
    strava_route : string, provider : string, rusa_route_id : string) => {
    const query : Query = {
        pace, interval, metric, rwgpsRoute: routeNumber, strava_activity, strava_route, provider, rusa_route_id
    }
    const formattedControls = formatControlsForUrl(controls, true)
    if (formattedControls !== "") {
        query.controlPoints = formattedControls
    }
    return query;
};

// this function exists to let us preserve the user's specified start time and share the url for this route
// with someone in another time zone
const dateToShortDate = function (date : DateTime) {
    return Number.parseInt(date.toSeconds().toFixed(0));
};

const buildUrl = (routeNumber : string, pace : string, interval : number, metric : boolean, 
    controls : Array<UserControl>, strava_activity : string,
    strava_route : string, provider : string, shortDate : number, start : DateTime, origin : string, 
    setPageUrl : boolean, zone : string,
    rusa_route_id : string) => {
    let query = makeQuery(routeNumber, pace, interval, metric, controls, strava_activity,
        strava_route, provider, rusa_route_id);
    if (!isNaN(shortDate)) {
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

export const generateUrl = (startTimestamp : number, routeNumber : string, pace : string, interval : number, 
    metric : boolean, controls : Array<UserControl>, strava_activity : string,
    strava_route : string, provider : string, origin : string, setPageUrl : boolean, zone : string, rusaRouteId : string) => {
    const start = DateTime.fromMillis(startTimestamp, {zone:zone})
    const shortDate = dateToShortDate(start);
    if (strava_route !== '') {
        routeNumber = ''
    }
    let url = buildUrl(routeNumber, pace, interval, metric, controls, strava_activity, strava_route,
         provider, shortDate, start, origin, setPageUrl, zone, rusaRouteId)
    if (url.url.length >= maxUrlLength) {
        const truncatedControls = shrinkControls(controls);
        url = buildUrl(routeNumber, pace, interval, metric, truncatedControls, 
            strava_activity, strava_route, provider,
             shortDate, start, origin, setPageUrl, zone, rusaRouteId)
    }
    return url;
}