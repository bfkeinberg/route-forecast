import * as Sentry from '@sentry/browser';
import { getRouteInfo } from '../utils/util';
import gpxParser from './gpxParser';

const getTimeZoneId = async (routeInfo, routeStart, timezoneApiKey, type) => {
  const rwgpsRouteData = routeInfo.rwgpsRouteData
  if (type === "rwgps") {
      const type = rwgpsRouteData.trip === undefined ? 'route' : 'trip';
      const rwgpsRouteDatum = rwgpsRouteData[type];
      const point = rwgpsRouteDatum['track_points'][0];
      return { result: "success", value: await gpxParser.findTimezoneForPoint(point.y, point.x, routeStart, timezoneApiKey) }
  } else if (routeInfo.gpxRouteData !== null) {
      if (routeInfo.gpxRouteData.tracks[0] === undefined) {
          Sentry.captureMessage(JSON.stringify(routeInfo.gpxRouteData));
          return { result: "error", error: "GPX route missing tracks" }
      }
      const point = getState().routeInfo.gpxRouteData.tracks[0].segments[0][0];
      return { result: "success", value: await gpxParser.findTimezoneForPoint(point.lat, point.lon, routeStart, timezoneApiKey) }
  } else {
      return { result: "error", error: "GPX route data missing" }
  }
}

const doForecastShitFetch = async (path, formData) => {
  try {
      const response = await fetch(path, {
          method: 'POST',
          body: formData
      })
      if (response.ok) {
          return { result: "success", value: await response.json() }
      } else {
          let details = await response.json();
          if (details !== undefined) {
              if (details.details !== undefined) {
                  throw new Error(details.details);
              } else {
                  throw new Error(details.status);
              }
          }
          let error = response.statusText !== undefined ? response.statusText : response['status'];
          throw new Error(error);
      }
  } catch (error) {
      let errorMessage = error.message !== undefined ? error.message : error;
      return { result: "error", error: errorMessage }
  }
}

const getForecastDependentValues = (state, parsedRouteInfo, forecast, timeZoneId) => {

  const { forecastRequest, points, values, finishTime, timeInHours} = parsedRouteInfo

  return gpxParser.adjustForWind(
      forecast,
      points,
      state.uiInfo.routeParams.pace,
      state.controls.userControlPoints,
      values,
      state.uiInfo.routeParams.start,
      state.controls.metric,
      finishTime,
      timeZoneId
  );
}

export const doForecastShit = async (state) => {
  const type = state.routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx"
  const {result, value, error} = await getTimeZoneId(state.routeInfo, state.uiInfo.routeParams.start, state.params.timezone_api_key, type)
  if (result === "error") {
      return { result: "error", error}
  }
  const {zoneId: timeZoneId, offset: timeZoneOffset} = value

  const parsedRouteInfo = getRouteInfo(state, type, timeZoneId)

  const { forecastRequest, points, values, finishTime, timeInHours} = parsedRouteInfo
  const formdata = new FormData();
  formdata.append('locations', JSON.stringify(forecastRequest));
  formdata.append('timezone', timeZoneId);
  formdata.append('service', state.forecast.weatherProvider);
  formdata.append('routeName', state.routeInfo.name);
  formdata.append('routeNumber', state.uiInfo.routeParams.rwgpsRoute);

  const forecastResults = await doForecastShitFetch(state.params.action, formdata)
  if (forecastResults.result === "success") {
      const forecastDependentValues = getForecastDependentValues(state, parsedRouteInfo, forecastResults.value.forecast, timeZoneId)
      const { time: weatherCorrectionMinutes, values: calculatedValues, gustSpeed, finishTime } = forecastDependentValues
      const weatherCorrection = { weatherCorrectionMinutes, finishTime, gustSpeed }
      return { result: "success", value: { forecast: forecastResults.value, weatherCorrection, calculatedValues } }
  } else {
      return { result: "error", error: forecastResults.error}
  }
}