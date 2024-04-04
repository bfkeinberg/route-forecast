import * as Sentry from '@sentry/browser';
import { DateTime } from 'luxon';

import { getRouteInfo } from '../utils/util';

const findTimezoneForPoint = (lat, lon, time, timezone_api_key, abortSignal) => {
    return fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${time.toSeconds()}&key=${timezone_api_key}`, {signal: abortSignal})
    .then( response => {
        if (response.ok) {
            return response.json();
        }
        if (response.error) {
            throw Error(response.error());
        } else {
            throw Error(JSON.stringify(response))
        }
    })
    .then (body => {
        // check for error in body of message
        if (body.errorMessage !== undefined) {
            throw Error(body.errorMessage);
        }
        // determine total timezone offset in seconds
        let tzOffset = body.dstOffset + body.rawOffset;
        return ({offset:tzOffset,zoneId:body.timeZoneId});
    })
    .catch(error => {return Error(error.message + " time zone")});
}

const getTimeZoneId = async (routeInfo, routeStart, timezoneApiKey, type, abortSignal) => {
  const rwgpsRouteData = routeInfo.rwgpsRouteData
  if (type === "rwgps") {
      const type = rwgpsRouteData.trip === undefined ? 'route' : 'trip';
      const rwgpsRouteDatum = rwgpsRouteData[type];
      const point = rwgpsRouteDatum['track_points'][0];
      const zoneInfo = await findTimezoneForPoint(point.y, point.x, routeStart, timezoneApiKey, abortSignal);
      if (zoneInfo instanceof Error) {
          return { result : "error", error : zoneInfo}
      }
      return { result: "success", value: zoneInfo}
  } else if (routeInfo.gpxRouteData !== null) {
      if (routeInfo.gpxRouteData.tracks[0] === undefined) {
          Sentry.captureMessage(JSON.stringify(routeInfo.gpxRouteData));
          return { result: "error", error: "GPX route missing tracks" }
      }
      const point = routeInfo.gpxRouteData.tracks[0].points[0];
      return { result: "success", value: await findTimezoneForPoint(point.lat, point.lon, routeStart, timezoneApiKey, abortSignal) }
  } else {
      return { result: "error", error: "GPX route data missing" }
  }
}

const getError = async (response) => {
    try {
        let details = await response.clone().json();
        return details;
    } catch {
        let details = response.text();
        return {details:details}
    }
}

const doForecastFetch = async (path, formData, abortSignal) => {
  try {
      const response = await fetch(path, {
          method: 'POST',
          body: formData,
          signal: abortSignal
      })
      if (response.ok) {
          return { result: "success", value: await response.json() }
      } else {
          let details = await getError(response);
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

export const getForecastRequestLength = (state) => {
    const type = state.routeInfo.rwgpsRouteData ? "rwgps" : "gpx"
    const timeZoneId = state.uiInfo.routeParams.zone
    const parsedRouteInfo = getRouteInfo(state, type, timeZoneId)
    if (!parsedRouteInfo) {
        return 0;
    }
    const { forecastRequest} = parsedRouteInfo
    return forecastRequest !== undefined ? forecastRequest.length : 0;
}

export const requestTimeZoneForRoute = async (state) => {
    const fetchController = new AbortController()
    const type = state.routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx"
    const { result, value, error } = await getTimeZoneId(state.routeInfo, DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, { zone: state.uiInfo.routeParams.zone }),
        state.params.timezone_api_key, type, fetchController.signal)
    if (result === "error") {
        return { result: "error", error }
    }
    return { result: value.zoneId }
}

export const doForecast = async (state, abortSignal) => {
    const type = state.routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx"
    const { result, value, error } = await getTimeZoneId(state.routeInfo, DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, { zone: state.uiInfo.routeParams.zone }),
        state.params.timezone_api_key, type, abortSignal)
    if (result === "error") {
        return { result: "error", error }
    }
    const { zoneId: timeZoneId } = value

    const parsedRouteInfo = getRouteInfo(state, type, timeZoneId)
    if (parsedRouteInfo === undefined) {
        return { result: "error", error: "No route could be loaded" }
    }
    const { forecastRequest } = parsedRouteInfo
    const formdata = new FormData();
    formdata.append('locations', JSON.stringify(forecastRequest));
    formdata.append('timezone', timeZoneId);
    formdata.append('service', state.forecast.weatherProvider);
    formdata.append('routeName', state.routeInfo.name);
    formdata.append('routeNumber', state.uiInfo.routeParams.rwgpsRoute);

    const forecastResults = await doForecastFetch(state.params.action, formdata, abortSignal)
    if (forecastResults.result === "success") {
        let forecast = { result: "success", value: { forecast: forecastResults.value, timeZoneId } }
        if (state.forecast.fetchAqi) {
            const aqiResults = await doForecastFetch("/aqi", formdata, abortSignal)
            if (aqiResults.result === "success") {
                for (let indx = 0;indx < forecastResults.value.forecast.length;indx++) {
                    forecastResults.value.forecast[indx].aqi = aqiResults.value.forecast[indx].aqi;
                }
            }
        }
        return forecast;
    } else {
        if (forecastResults.error === "The user aborted a request.") {
            return { result: "canceled" }
        } else {
            return { result: "error", error: forecastResults.error }
        }
    }
}