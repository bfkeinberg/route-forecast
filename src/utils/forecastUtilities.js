import * as Sentry from '@sentry/browser';
import { getRouteInfo } from '../utils/util';

const findTimezoneForPoint = (lat, lon, time, maps_api_key, abortSignal) => {
    return fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${time.toSeconds()}&key=${maps_api_key}`, {signal: abortSignal}).then( response => {
        if (response.ok) {
            return response.json();
        }
        throw Error(response.error());
    }).then (body => {
        // check for error in body of message
        if (body.errorMessage !== undefined) {
            throw Error(body.errorMessage);
        }
        // determine total timezone offset in seconds
        let tzOffset = body.dstOffset + body.rawOffset;
        return ({offset:tzOffset,zoneId:body.timeZoneId});
    });
}

const getTimeZoneId = async (routeInfo, routeStart, timezoneApiKey, type, abortSignal) => {
  const rwgpsRouteData = routeInfo.rwgpsRouteData
  if (type === "rwgps") {
      const type = rwgpsRouteData.trip === undefined ? 'route' : 'trip';
      const rwgpsRouteDatum = rwgpsRouteData[type];
      const point = rwgpsRouteDatum['track_points'][0];
      return { result: "success", value: await findTimezoneForPoint(point.y, point.x, routeStart, timezoneApiKey, abortSignal) }
  } else if (routeInfo.gpxRouteData !== null) {
      if (routeInfo.gpxRouteData.tracks[0] === undefined) {
          Sentry.captureMessage(JSON.stringify(routeInfo.gpxRouteData));
          return { result: "error", error: "GPX route missing tracks" }
      }
      const point = routeInfo.gpxRouteData.tracks[0].segments[0][0];
      return { result: "success", value: await findTimezoneForPoint(point.lat, point.lon, routeStart, timezoneApiKey, abortSignal) }
  } else {
      return { result: "error", error: "GPX route data missing" }
  }
}

const doForecastShitFetch = async (path, formData, abortSignal) => {
  try {
      const response = await fetch(path, {
          method: 'POST',
          body: formData,
          signal: abortSignal
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

export const doForecastShit = async (state, abortSignal) => {
  const type = state.routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx"
  const {result, value, error} = await getTimeZoneId(state.routeInfo, state.uiInfo.routeParams.start, state.params.timezone_api_key, type, abortSignal)
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

  const forecastResults = await doForecastShitFetch(state.params.action, formdata, abortSignal)
  if (forecastResults.result === "success") {
      return { result: "success", value: { forecast: forecastResults.value, timeZoneId } }
  } else {
      if (forecastResults.error === "The user aborted a request.") {
        return { result: "canceled"}
      } else {
        return { result: "error", error: forecastResults.error}
      }
  }
}