import { DateTime } from 'luxon';

import gpxParser from "./gpxParser";

const formatOneControl = (controlPoint) => {
  if (typeof controlPoint === 'string') {
    return controlPoint;
  }
  return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
};

export const maxWidthForMobile = '501px'

// TODO
// ask wtf is up with this & parseControls()
export const formatControlsForUrl = (controlPoints, filter) => {
  const filteredControlPoints = filter ? controlPoints.filter(point => point.name !== '').filter(point => {return !isNaN(point.distance) && !isNaN(point.duration)}) : controlPoints
  return filteredControlPoints.reduce((queryParam,point) => {return formatOneControl(queryParam) + ':' + formatOneControl(point)},'');
};

export const setMinMaxCoords = (trackPoint,bounds) => {
  bounds.min_latitude = Math.min(trackPoint.lat, bounds.min_latitude);
  bounds.min_longitude = Math.min(trackPoint.lon, bounds.min_longitude);
  bounds.max_latitude = Math.max(trackPoint.lat, bounds.max_latitude);
  bounds.max_longitude = Math.max(trackPoint.lon, bounds.max_longitude);
  return bounds;
};

export const getRouteInfo = (state, type, timeZoneId, segment) => {
  const routeData = state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"]
  if (!routeData) {
    return routeData;
  }
  const walkFunction = type === "rwgps" ? gpxParser.walkRwgpsRoute : gpxParser.walkGpxRoute
  return walkFunction(
    routeData,
    DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, {zone:timeZoneId}),
    state.uiInfo.routeParams.pace,
    state.uiInfo.routeParams.interval,
    state.controls.userControlPoints,
    timeZoneId,
    segment
  )
}

export const getForecastRequest = (routeData, startTimestamp, type, timeZoneId, pace, interval, userControlPoints, segment) =>
{
  const walkFunction = type === "rwgps" ? gpxParser.walkRwgpsRoute : gpxParser.walkGpxRoute
  return walkFunction(
    routeData,
    DateTime.fromMillis(startTimestamp, {zone:timeZoneId}),
    pace,
    interval,
    userControlPoints,
    timeZoneId,
    segment
  ).forecastRequest
}

export const parseControls = function (controlPointString, deleteFirstElement) {
  if (controlPointString === null || controlPointString === undefined) {
    return [];
  }
  if (deleteFirstElement) {
    let controlPointList = controlPointString.split(":");
    let controlPoints =
      controlPointList.filter(item => item.length > 0)
        .filter(point => { const values = point.split(",");return !isNaN(values[1]) && !isNaN(values[2]) })
        .map((point, index) => {
          let controlPointValues = point.split(",");
          return ({ name: controlPointValues[0], distance: Number(controlPointValues[1]), duration: Number(controlPointValues[2]), id: index });
        });
    // delete dummy first element
    // controlPoints.splice(0, 1);
    return controlPoints;
  } else {
    let controlPointList = controlPointString.split(":");
    const controlPoints = controlPointList.filter(item => item.length > 0).filter(point => { const values = point.split(",");return !isNaN(values[1]) && !isNaN(values[2]) })
      .map((point, index) => {
        let controlPointValues = point.split(",");
        return ({ name: controlPointValues[0], distance: Number(controlPointValues[1]), duration: Number(controlPointValues[2]), id: index });
      });
    // delete dummy first element
    // controlPoints.splice(0, 1);
    return controlPoints;
  }
}

export const getRouteName = (route, type) => (type === "rwgps" ? route[route.type].name : route.tracks[0].name);

export const controlsMeaningfullyDifferent = (controls1, controls2) => {
  return controls1.length !== controls2.length ||
    controls1.some(
      (control, index) => control.distance !== controls2[index].distance ||
                          control.duration !== controls2[index].duration
    )
}

export const extractControlsFromRoute = (routeData) => {
  return gpxParser.extractControlPoints(routeData, 'rwgps');
}

export const stringIsOnlyNumeric = string => string.match(/^[0-9]*$/) !== null
export const stringIsOnlyDecimal = string => string.match(/^[0-9.]*$/) !== null

export const milesToMeters = 1609.34;

export const paceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C':14, 'C+':15, 'D':16, 'D+':17, 'E':18, 'E+':19, "F":20, "F+":21};
export const inputPaceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C-':13, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E':18, 'E+':19, "F":20, "F+":21};
export const metricPaceToSpeed = {"Q":5, "R":6, "S":8, "T":10, 'A-':15, 'A':16, 'A+':18, 'B-':18, 'B':19, 'B+':21, 'C-':21, 'C':22, 'C+':24, 'D-':24, 'D':26, 'D+':27, 'E-':27, 'E':29, "E+":31, "F":32, "F+":34};

export const getRouteNumberFromValue = (value) => {
  if (value !== '' && value !== null) {
      // is this just a number or a full url?
      let route = parseInt(value);
      if (isNaN(route)) {
        // the id may be too large to fit into a Number, so don't rely on that
          route = value.substring(value.lastIndexOf('/') + 1)
      } else {
        return value
      }
      return route;
  }
  return value;
}

