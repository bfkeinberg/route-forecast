import gpxParser from "./gpxParser";

const formatOneControl = (controlPoint) => {
  if (typeof controlPoint === 'string') {
    return controlPoint;
  }
  return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
}

export const formatControlsForUrl = (controlPoints) => {
  return controlPoints.reduce((queryParam,point) => {return formatOneControl(queryParam) + ':' + formatOneControl(point)},'');
};

export const setMinMaxCoords = (trackPoint,bounds) => {
  bounds.min_latitude = Math.min(trackPoint.lat, bounds.min_latitude);
  bounds.min_longitude = Math.min(trackPoint.lon, bounds.min_longitude);
  bounds.max_latitude = Math.max(trackPoint.lat, bounds.max_latitude);
  bounds.max_longitude = Math.max(trackPoint.lon, bounds.max_longitude);
  return bounds;
};

export const getRouteInfo = (state, type, timeZoneId) => {
  const routeData = state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"]
  const walkFunction = type === "rwgps" ? gpxParser.walkRwgpsRoute : gpxParser.walkGpxRoute
  return walkFunction(
    routeData,
    state.uiInfo.routeParams.start,
    state.uiInfo.routeParams.pace,
    state.uiInfo.routeParams.interval,
    state.controls.userControlPoints,
    state.controls.metric,
    timeZoneId
  )
}

export const getRouteName = (route, type) => type === "rwgps" ? route[route.type].name : route.tracks[0].name;

export const milesToMeters = 1609.34;

export const paceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C':14, 'C+':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const inputPaceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C-':13, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const metricPaceToSpeed = {'A-':15, 'A':16, 'B-':18, 'B':19, 'C-':21, 'C':22, 'C+':24, 'D-':24, 'D':26, 'D+':27, 'E-':27, 'E':29};